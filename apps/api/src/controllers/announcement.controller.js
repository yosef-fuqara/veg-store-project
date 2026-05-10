const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");
const Announcement = require("../models/announcement.model");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const AppError = require("../utils/app-error");
const {
  uploadBufferToCloudinary,
  destroyCloudinaryImage
} = require("../services/image-upload.service");

function announcementImageFolder() {
  const base = process.env.CLOUDINARY_FOLDER || "veg-store";
  return `${base}/announcements`;
}

function normalizeCtaSubdoc(cta) {
  const textIn = cta && typeof cta.text === "object" && cta.text ? cta.text : {};
  return {
    text: {
      he: typeof textIn.he === "string" ? textIn.he.trim().slice(0, 80) : "",
      en: typeof textIn.en === "string" ? textIn.en.trim().slice(0, 80) : "",
      ar: typeof textIn.ar === "string" ? textIn.ar.trim().slice(0, 80) : ""
    },
    type: cta && ["none", "product", "category", "custom"].includes(cta.type) ? cta.type : "none",
    productId: null,
    categoryId: null,
    url: ""
  };
}

function applyCtaTypeFields(cta) {
  const base = normalizeCtaSubdoc(cta);
  if (base.type === "product" && cta.productId) {
    base.productId = new mongoose.Types.ObjectId(String(cta.productId));
  }
  if (base.type === "category" && cta.categoryId) {
    base.categoryId = new mongoose.Types.ObjectId(String(cta.categoryId));
  }
  if (base.type === "custom" && typeof cta.url === "string") {
    base.url = cta.url.trim().slice(0, 2000);
  }
  return base;
}

async function assertCtaReferences(cta) {
  if (!cta || cta.type === "none") return;
  if (cta.type === "product") {
    const exists = await Product.exists({ _id: cta.productId, isDeleted: false });
    if (!exists) {
      throw new AppError("CTA product not found", StatusCodes.BAD_REQUEST);
    }
  }
  if (cta.type === "category") {
    const exists = await Category.exists({ _id: cta.categoryId, isDeleted: false });
    if (!exists) {
      throw new AppError("CTA category not found", StatusCodes.BAD_REQUEST);
    }
  }
}

function buildPublicCta(o) {
  const legacyLink = (o.buttonLink || "").trim();
  const legacyText = (o.buttonText || "").trim();
  const ctaRaw = o.cta;
  const hasStructuredCta =
    ctaRaw &&
    typeof ctaRaw === "object" &&
    ctaRaw.type &&
    ctaRaw.type !== "none";

  if (!hasStructuredCta) {
    if (!legacyLink) return null;
    const t = legacyText || "";
    return {
      text: { he: t, en: t, ar: t },
      type: "custom",
      productId: null,
      categoryId: null,
      url: legacyLink
    };
  }

  const text = ctaRaw.text && typeof ctaRaw.text === "object" ? ctaRaw.text : {};
  return {
    text: {
      he: typeof text.he === "string" ? text.he : "",
      en: typeof text.en === "string" ? text.en : "",
      ar: typeof text.ar === "string" ? text.ar : ""
    },
    type: ctaRaw.type,
    productId: ctaRaw.productId ? String(ctaRaw.productId) : null,
    categoryId: ctaRaw.categoryId ? String(ctaRaw.categoryId) : null,
    url: typeof ctaRaw.url === "string" ? ctaRaw.url : ""
  };
}

function buildAdminCta(o) {
  const ctaRaw = o.cta;
  if (!ctaRaw || typeof ctaRaw !== "object") {
    return normalizeCtaSubdoc({ type: "none", text: {} });
  }
  return {
    text: {
      he: ctaRaw.text?.he || "",
      en: ctaRaw.text?.en || "",
      ar: ctaRaw.text?.ar || ""
    },
    type: ctaRaw.type || "none",
    productId: ctaRaw.productId ? String(ctaRaw.productId) : null,
    categoryId: ctaRaw.categoryId ? String(ctaRaw.categoryId) : null,
    url: ctaRaw.url || ""
  };
}

function toPublicAnnouncement(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    title: o.title,
    message: o.message,
    imageUrl: o.imageUrl || "",
    startsAt: o.startsAt,
    endsAt: o.endsAt,
    cta: buildPublicCta(o)
  };
}

function toAdminAnnouncement(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    title: o.title,
    message: o.message,
    imageUrl: o.imageUrl || "",
    buttonText: o.buttonText || "",
    buttonLink: o.buttonLink || "",
    cta: buildAdminCta(o),
    isActive: o.isActive,
    startsAt: o.startsAt,
    endsAt: o.endsAt,
    archivedAt: o.archivedAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt
  };
}

function computeEndsAtFromBody(startsAt, body) {
  if (body.durationHours != null) {
    const start = new Date(startsAt);
    return new Date(start.getTime() + Number(body.durationHours) * 3600 * 1000);
  }
  return new Date(body.endsAt);
}

const getActiveAnnouncement = async (req, res, next) => {
  try {
    const now = new Date();
    const doc = await Announcement.findOne({
      isActive: true,
      archivedAt: null,
      startsAt: { $lte: now },
      endsAt: { $gte: now }
    })
      .sort({ updatedAt: -1 })
      .lean();

    const announcement = doc ? toPublicAnnouncement(doc) : null;
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { announcement }
    });
  } catch (error) {
    return next(error);
  }
};

const listAnnouncements = async (req, res, next) => {
  try {
    const includeArchived = String(req.query.includeArchived || "") === "true";
    const filter = includeArchived ? {} : { archivedAt: null };
    const rows = await Announcement.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { announcements: rows.map((r) => toAdminAnnouncement(r)) }
    });
  } catch (error) {
    return next(error);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const startsAt = new Date(req.body.startsAt);
    const endsAt = computeEndsAtFromBody(startsAt, req.body);
    if (endsAt <= startsAt) {
      throw new AppError("endsAt must be after startsAt", StatusCodes.BAD_REQUEST);
    }

    let imageUrl = "";
    let imagePublicId = "";
    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(
        req.file.buffer,
        announcementImageFolder()
      );
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const hasCtaPayload =
      req.body.cta != null && typeof req.body.cta === "object" && req.body.cta.type !== "__invalid_json__";
    let ctaSubdoc = normalizeCtaSubdoc({ type: "none", text: {} });
    let nextButtonText = req.body.buttonText || "";
    let nextButtonLink = req.body.buttonLink || "";
    if (hasCtaPayload) {
      ctaSubdoc = applyCtaTypeFields(req.body.cta);
      await assertCtaReferences(ctaSubdoc);
      nextButtonText = "";
      nextButtonLink = "";
    }

    try {
      const doc = await Announcement.create({
        title: req.body.title,
        message: req.body.message,
        imageUrl,
        imagePublicId,
        buttonText: nextButtonText,
        buttonLink: nextButtonLink,
        cta: ctaSubdoc,
        isActive: typeof req.body.isActive === "boolean" ? req.body.isActive : false,
        startsAt,
        endsAt
      });

      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: { announcement: toAdminAnnouncement(doc) }
      });
    } catch (error) {
      if (imagePublicId) {
        await destroyCloudinaryImage(imagePublicId);
      }
      throw error;
    }
  } catch (error) {
    return next(error);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const doc = await Announcement.findById(req.params.id);
    if (!doc) {
      throw new AppError("Announcement not found", StatusCodes.NOT_FOUND);
    }
    if (doc.archivedAt) {
      throw new AppError("Archived announcements cannot be edited", StatusCodes.BAD_REQUEST);
    }

    const body = req.body;
    let nextStartsAt = doc.startsAt;
    if (body.startsAt != null) {
      nextStartsAt = new Date(body.startsAt);
    }

    let nextEndsAt = doc.endsAt;
    if (body.durationHours != null) {
      nextEndsAt = computeEndsAtFromBody(nextStartsAt, body);
    } else if (body.endsAt != null) {
      nextEndsAt = new Date(body.endsAt);
    }

    if (nextEndsAt <= nextStartsAt) {
      throw new AppError("endsAt must be after startsAt", StatusCodes.BAD_REQUEST);
    }

    if (body.title != null) doc.title = body.title;
    if (body.message != null) doc.message = body.message;

    const hasCtaPayload =
      body.cta != null && typeof body.cta === "object" && body.cta.type !== "__invalid_json__";
    if (hasCtaPayload) {
      const ctaSubdoc = applyCtaTypeFields(body.cta);
      await assertCtaReferences(ctaSubdoc);
      doc.cta = ctaSubdoc;
      doc.buttonText = "";
      doc.buttonLink = "";
    } else {
      if (body.buttonText !== undefined) doc.buttonText = body.buttonText || "";
      if (body.buttonLink !== undefined) doc.buttonLink = body.buttonLink || "";
    }

    if (typeof body.isActive === "boolean") doc.isActive = body.isActive;
    doc.startsAt = nextStartsAt;
    doc.endsAt = nextEndsAt;

    const previousImagePublicId = doc.imagePublicId || "";

    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(
        req.file.buffer,
        announcementImageFolder()
      );
      doc.imageUrl = uploadResult.secure_url;
      doc.imagePublicId = uploadResult.public_id;
      try {
        await doc.save();
      } catch (error) {
        await destroyCloudinaryImage(uploadResult.public_id);
        throw error;
      }
      if (previousImagePublicId && previousImagePublicId !== doc.imagePublicId) {
        await destroyCloudinaryImage(previousImagePublicId);
      }
      return res.status(StatusCodes.OK).json({
        success: true,
        data: { announcement: toAdminAnnouncement(doc) }
      });
    }

    if (body.removeImage === true) {
      doc.imageUrl = "";
      doc.imagePublicId = "";
      await doc.save();
      if (previousImagePublicId) {
        await destroyCloudinaryImage(previousImagePublicId);
      }
      return res.status(StatusCodes.OK).json({
        success: true,
        data: { announcement: toAdminAnnouncement(doc) }
      });
    }

    await doc.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { announcement: toAdminAnnouncement(doc) }
    });
  } catch (error) {
    return next(error);
  }
};

const setAnnouncementActive = async (req, res, next) => {
  try {
    const doc = await Announcement.findById(req.params.id);
    if (!doc) {
      throw new AppError("Announcement not found", StatusCodes.NOT_FOUND);
    }
    if (doc.archivedAt) {
      throw new AppError("Archived announcements cannot be activated", StatusCodes.BAD_REQUEST);
    }
    doc.isActive = req.body.isActive;
    await doc.save();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { announcement: toAdminAnnouncement(doc) }
    });
  } catch (error) {
    return next(error);
  }
};

const archiveAnnouncement = async (req, res, next) => {
  try {
    const doc = await Announcement.findById(req.params.id);
    if (!doc) {
      throw new AppError("Announcement not found", StatusCodes.NOT_FOUND);
    }
    doc.archivedAt = new Date();
    doc.isActive = false;
    await doc.save();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { announcement: toAdminAnnouncement(doc) }
    });
  } catch (error) {
    return next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const doc = await Announcement.findById(req.params.id);
    if (!doc) {
      throw new AppError("Announcement not found", StatusCodes.NOT_FOUND);
    }
    const publicId = doc.imagePublicId || "";
    await doc.deleteOne();
    if (publicId) {
      await destroyCloudinaryImage(publicId);
    }
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { deletedId: String(doc._id) }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getActiveAnnouncement,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  setAnnouncementActive,
  archiveAnnouncement,
  deleteAnnouncement
};
