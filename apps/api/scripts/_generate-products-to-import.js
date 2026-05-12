/**
 * One-off helper to regenerate products-to-import.json from a single table.
 * Run: node scripts/_generate-products-to-import.js
 */
const fs = require("fs");
const path = require("path");

const photosDir = path.join(__dirname, "..", "..", "..", "photos");
const outPath = path.join(__dirname, "products-to-import.json");

const M = (slug, unit, price, ar, he, en) => ({ categorySlug: slug, unit, price, name: { ar, he, en }, description: "" });

/** @type {Record<string, ReturnType<typeof M>>} */
const MAP = {
  "אבוקדו.png": M("fruits", "unit", 9, "أفوكادو", "אבוקדו", "Avocado"),
  "אבטיח קטן.png": M("fruits", "unit", 22, "بطيخ صغير", "אבטיח קטן", "Small watermelon"),
  "אבטיח.png": M("fruits", "unit", 35, "بطيخ", "אבטיח", "Watermelon"),
  "אגס סבדונה.png": M("fruits", "kg", 18, "كمثرى سبادونا", "אגס סבדונה", "Spadona pear"),
  "אוכמניות.png": M("fruits", "unit", 32, "توت أزرق", "אוכמניות", "Blueberries"),
  "אנונה.png": M("fruits", "unit", 28, "أنونا", "אנונה", "Cherimoya"),
  "אננס.png": M("fruits", "unit", 28, "أناناس", "אננס", "Pineapple"),
  "אספרגוס.png": M("vegetables", "unit", 22, "هليون", "אספרגוס", "Asparagus"),
  "אפונה.png": M("vegetables", "kg", 18, "بازلاء", "אפונה", "Green peas"),
  "אפרסמון.png": M("fruits", "kg", 22, "كاكي", "אפרסמון", "Persimmon"),
  "אפרסק לבן.png": M("fruits", "kg", 24, "خوخ أبيض", "אפרסק לבן", "White peach"),
  "אפרסק קטן.png": M("fruits", "kg", 24, "خوخ صغير", "אפרסק קטן", "Small peach"),
  "אשכולית אדומה.png": M("fruits", "kg", 14, "جريب فروت أحمر", "אשכולית אדומה", "Red grapefruit"),
  "אשכולית.png": M("fruits", "kg", 12, "جريب فروت", "אשכולית", "Grapefruit"),
  "באמיה.png": M("vegetables", "kg", 16, "بامية", "באמיה", "Okra"),
  "בזיליקום.png": M("herbs", "unit", 8, "ريحان", "בזיליקום", "Basil"),
  "במיה.png": M("vegetables", "kg", 16, "بامية", "במיה", "Okra"),
  "בננה.png": M("fruits", "kg", 12, "موز", "בננה", "Banana"),
  "בעג'יר.png": M("vegetables", "kg", 14, "طماطم باغير", "עגבניית בגירה", "Bagira tomato"),
  "בצל ירוק.png": M("vegetables", "unit", 8, "بصل أخضر", "בצל ירוק", "Green onion"),
  "בצל לבן.png": M("vegetables", "kg", 6, "بصل أبيض", "בצל לבן", "White onion"),
  "בצל קטן.png": M("vegetables", "kg", 7, "بصل صغير", "בצל קטן", "Small onion"),
  "ברוקלי.png": M("vegetables", "unit", 12, "بروكلي", "ברוקלי", "Broccoli"),
  "גויאבה.png": M("fruits", "kg", 18, "جوافة", "גויאבה", "Guava"),
  "גזר.png": M("vegetables", "kg", 8, "جزر", "גזר", "Carrot"),
  "גינגיר.png": M("vegetables", "kg", 28, "زنجبيل", "גינגיר", "Ginger"),
  "גרגיר.png": M("herbs", "unit", 8, "رشاد", "גרגיר", "Garden cress"),
  "דובדובן.png": M("fruits", "kg", 38, "كرز", "דובדבן", "Cherries"),
  "דלעת.png": M("vegetables", "kg", 10, "قرع", "דלעת", "Pumpkin"),
  "זעתר.png": M("spices", "unit", 14, "زعتر", "זעתר", "Za’atar mix"),
  "חומוס ירוק.png": M("vegetables", "unit", 22, "حمص أخضر", "חומוס ירוק", "Fresh green chickpeas"),
  "חמוצים .png": M("pickles", "unit", 16, "مخلل", "חמוצים", "Pickles"),
  "חמוצים זיתים.png": M("pickles", "unit", 18, "مخلل زيتون", "חמוצים זיתים", "Pickled olives"),
  "חסה לבבות קיסר.png": M("vegetables", "unit", 12, "خس قلوب قيصر", "חסה לבבות קיסר", "Romaine hearts"),
  "חסה סלנובה.png": M("vegetables", "unit", 10, "خس سلانوفا", "חסה סלנובה", "Iceberg lettuce"),
  "חסה.png": M("vegetables", "unit", 9, "خس", "חסה", "Lettuce"),
  "חציל לממולאים.png": M("vegetables", "kg", 12, "باذنجان للحشو", "חציל לממולאים", "Eggplant for stuffing"),
  "חציל עגמי.png": M("vegetables", "kg", 12, "باذنجان عجمي", "חציל עגמי", "Agami eggplant"),
  "כוסברה.png": M("herbs", "unit", 6, "كزبرة", "כוסברה", "Cilantro"),
  "כרוב אדום.png": M("vegetables", "unit", 10, "ملفوف أحمر", "כרוב אדום", "Red cabbage"),
  "כרוב לבן.png": M("vegetables", "unit", 8, "ملفوف أبيض", "כרוב לבן", "White cabbage"),
  "כרובית.png": M("vegetables", "unit", 14, "قرنبيط", "כרובית", "Cauliflower"),
  "לוביה ירוק.png": M("vegetables", "kg", 18, "فاصوليا خضراء", "לוביה ירוק", "Green beans"),
  "לוז טרי ירוק.png": M("fruits", "kg", 55, "لوز أخضر طازج", "לוז טרי ירוק", "Fresh green almonds"),
  "לימון.png": M("fruits", "kg", 10, "ليمون", "לימון", "Lemon"),
  "ליצי.png": M("fruits", "unit", 28, "ليتشي", "ליצי", "Lychee"),
  "לפת.png": M("vegetables", "kg", 10, "لفت", "לפת", "Turnip"),
  "מטלי.png": M("fruits", "kg", 16, "برقوق", "שזיף", "Plum"),
  "מילון .png": M("fruits", "unit", 18, "شمام", "מלון", "Melon"),
  "מיץ לימון .png": M("__JUICE_LEMON__", "unit", 16, "عصير ليمون", "מיץ לימון", "Lemon juice"),
  "מיץ רימונים.png": M("__JUICE_POM__", "unit", 18, "عصير رمان", "מיץ רימונים", "Pomegranate juice"),
  "מלוכיה.png": M("herbs", "unit", 10, "ملوخية", "מלוכיה", "Molokhia"),
  "מלפפון חמוץ.png": M("pickles", "unit", 14, "مخلل خيار", "מלפפון חמוץ", "Pickled cucumber"),
  "מלפפון.png": M("vegetables", "kg", 8, "خيار", "מלפפון", "Cucumber"),
  "מנגו.png": M("fruits", "unit", 12, "مانجو", "מנגו", "Mango"),
  "מנדלינה.png": M("fruits", "kg", 14, "ماندارين", "מנדלינה", "Mandarin"),
  "משמש.png": M("fruits", "kg", 22, "مشمش", "משמש", "Apricot"),
  "נבטים.png": M("vegetables", "unit", 10, "براعم", "נבטים", "Sprouts"),
  "נענע.png": M("herbs", "unit", 8, "نعناع", "נענע", "Mint"),
  "נקטרינה גדול.png": M("fruits", "kg", 22, "نكتارين كبير", "נקטרינה גדול", "Large nectarine"),
  "נקטרינה צהוב.png": M("fruits", "kg", 22, "نكتارين أصفر", "נקטרינה צהוב", "Yellow nectarine"),
  "סברס.png": M("fruits", "unit", 6, "تين شوكي", "סברס", "Prickly pear"),
  "סלק אדום.png": M("vegetables", "kg", 8, "شمندر", "סלק אדום", "Beetroot"),
  "סלרי.png": M("vegetables", "unit", 10, "كرفس", "סלרי", "Celery"),
  "עגבניה מגי.png": M("vegetables", "kg", 12, "طماطم مجي", "עגבניה מגי", "Magi tomato"),
  "עגבניה שירי.png": M("vegetables", "kg", 16, "طماطم كرزية", "עגבניה שירי", "Cherry tomatoes"),
  "עלי גפן.png": M("vegetables", "unit", 12, "ورق عنب", "עלי גפן", "Grape leaves"),
  "ענבים טאלי.png": M("fruits", "kg", 22, "عنب تالي", "ענבים טאלי", "Table grapes (Tali)"),
  "ענבים לבן.png": M("fruits", "kg", 22, "عنب أبيض", "ענבים לבן", "White grapes"),
  "ענבים שחור.png": M("fruits", "kg", 22, "عنب أسود", "ענבים שחור", "Black grapes"),
  "ערמון.png": M("fruits", "kg", 48, "كستناء", "ערמון", "Chestnut"),
  "פול.png": M("vegetables", "kg", 14, "فول", "פול", "Fava beans"),
  "פומלה.png": M("fruits", "unit", 18, "بوملي", "פומלה", "Pomelo"),
  "פטריות בלדי.png": M("vegetables", "unit", 24, "فطر بلدي", "פטריות בלדי", "Local mushrooms"),
  "פיספלורה.png": M("fruits", "unit", 6, "ماراكويا", "פסיפלורה", "Passion fruit"),
  "פלפל אדום.png": M("vegetables", "kg", 14, "فلفل أحمر", "פלפל אדום", "Red bell pepper"),
  "פלפל.png": M("vegetables", "kg", 14, "فلفل", "פלפל", "Bell pepper"),
  "פנק לידי.png": M("fruits", "kg", 16, "تفاح بينك ليدي", "פנק לידי", "Pink Lady apple"),
  "פקוס.png": M("vegetables", "kg", 12, "فكوس / خيار عرائي", "פקוס מלפפון ערבי", "Lebanese cucumber (Beit Alpha)"),
  "פתאיה.png": M("fruits", "unit", 22, "دراقون فروت", "פיטאיה", "Dragon fruit"),
  "קולורבי.png": M("vegetables", "kg", 12, "كولرابي", "קולורבי", "Kohlrabi"),
  "קיוי.png": M("fruits", "kg", 22, "كيوي", "קיוי", "Kiwi"),
  "קישואים.png": M("vegetables", "kg", 10, "كوسا", "קישואים", "Zucchini"),
  "קסטנה.png": M("fruits", "kg", 48, "كستناء", "קסטנה", "Chestnuts"),
  "קרמבולה.png": M("fruits", "unit", 8, "كرمبولا", "קרמבולה", "Star fruit"),
  "קשואים גדולים.png": M("vegetables", "kg", 10, "كوسا كبيرة", "קשואים גדולים", "Large zucchini"),
  "קשואים למילואים.png": M("vegetables", "kg", 12, "كوسا للحشو", "קשואים למילואים", "Zucchini for stuffing"),
  "רימונים .png": M("fruits", "kg", 18, "رمان", "רימונים", "Pomegranate"),
  "שום ארוז.png": M("vegetables", "unit", 10, "ثوم معبأ", "שום ארוז", "Packaged garlic"),
  "שום עלים.png": M("herbs", "unit", 10, "ثوم أخضر", "שום עלים", "Green garlic"),
  "שומר.png": M("vegetables", "unit", 12, "شمر", "שומר", "Fennel"),
  "שזיף אורפה.png": M("fruits", "kg", 18, "برقوق أورفا", "שזיף אורפה", "Orphe plum"),
  "שזיף צהוב אדום ענק.png": M("fruits", "kg", 18, "برقوق أصفر-أحمر عملاق", "שזיף צהוב אדום ענק", "Large yellow-red plum"),
  "שזיף.png": M("fruits", "kg", 16, "برقوق", "שזיף", "Plum"),
  "שק תפוחי אדמה ביבי.png": M("vegetables", "unit", 22, "كيس بطاطا بيبي", "שק תפוחי אדמה ביבי", "Baby potato bag"),
  "שק תפוחי אדמה.png": M("vegetables", "unit", 28, "كيس بطاطا", "שק תפוחי אדמה", "Potato sack"),
  "תות שדה.png": M("fruits", "unit", 28, "فراولة", "תות שדה", "Strawberries"),
  "תמר מג'הול.png": M("fruits", "kg", 42, "تمر مجهول", "תמר מג'הול", "Medjool dates"),
  "תפוז זהוב סמיט.png": M("fruits", "kg", 12, "برتقال ذهبي سميت", "תפוז זהוב סמיט", "Golden Smitt orange"),
  "תפוז עלים.png": M("fruits", "kg", 12, "برتقال بأوراق", "תפוז עלים", "Orange with leaves"),
  "תפוז רשת.png": M("fruits", "kg", 12, "برتقال شبكة", "תפוז רשת", "Net bag oranges"),
  "תפוז.png": M("fruits", "kg", 10, "برتقال", "תפוז", "Orange"),
  "תפוח יונתן.png": M("fruits", "kg", 14, "تفاح جوناثان", "תפוח יונתן", "Jonathan apple"),
  "תפוח סטרקינג.png": M("fruits", "kg", 14, "تفاح ستاركن", "תפוח סטרקינג", "Starkin apple"),
  "תפוחי אדמה לבן.png": M("vegetables", "kg", 8, "بطاطا بيضاء", "תפוחי אדמה לבן", "White potatoes")
};

function main() {
  const files = fs
    .readdirSync(photosDir)
    .filter((f) => f.endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, "he"));

  const missing = [];
  const products = [];

  for (const image of files) {
    const row = MAP[image];
    if (!row) {
      missing.push(image);
      continue;
    }
    products.push({ image, ...row });
  }

  if (missing.length) {
    throw new Error(`Missing MAP entries for: ${missing.join(", ")}`);
  }

  const doc = {
    settings: {
      lemonJuiceCategorySlug: "",
      pomegranateJuiceCategorySlug: "",
      _comment:
        "Set slugs to match your DB (GET /categories). Or use env IMPORT_LEMON_JUICE_SLUG / IMPORT_POM_JUICE_SLUG."
    },
    products
  };

  fs.writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  // eslint-disable-next-line no-console
  console.log(`Wrote ${products.length} products to ${path.relative(process.cwd(), outPath)}`);
}

main();
