import { json } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { requireAdmin } from "../sessions.server";
import adminStyles from "../styles/admin.css";

export function links() {
  return [{ rel: "stylesheet", href: adminStyles }];
}

export async function loader({ request }) {
  await requireAdmin(request);
  return json({});
}

export default function AdminIndex() {
  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Live Globe — Admin</h1>
        <nav className="admin-nav">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/settings">Settings</Link>
        </nav>
        <Form method="post" action="/admin/logout">
          <button type="submit" className="admin-btn secondary">Sign out</button>
        </Form>
      </header>

      <main className="admin-main">
        <p className="admin-welcome">Hello, Admin.</p>
        <p>Use the nav above to manage globe settings.</p>
      </main>
    </div>
  );
}
