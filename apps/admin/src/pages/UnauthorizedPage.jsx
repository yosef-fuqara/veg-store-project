import { Link } from "react-router-dom";

const UnauthorizedPage = () => {
  return (
    <section style={{ marginTop: "2rem" }}>
      <h1>Unauthorized</h1>
      <p>Your account does not have admin access.</p>
      <Link to="/login">Back to login</Link>
    </section>
  );
};

export default UnauthorizedPage;
