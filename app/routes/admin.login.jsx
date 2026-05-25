import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { getSession, commitSession } from "../sessions.server";
import adminStyles from "../styles/admin.css";

export function links() {
  return [{ rel: "stylesheet", href: adminStyles }];
}

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.get("isAdmin")) {
    return redirect("/admin");
  }
  return json({});
}

export async function action({ request }) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  const validUsername = process.env.ADMIN_USERNAME ?? "admin";
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validPassword) {
    return json({ error: "ADMIN_PASSWORD environment variable is not set." }, { status: 500 });
  }

  if (username !== validUsername || password !== validPassword) {
    return json({ error: "Invalid username or password." }, { status: 401 });
  }

  const session = await getSession(request.headers.get("Cookie"));
  session.set("isAdmin", true);

  return redirect("/admin", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export default function AdminLogin() {
  const actionData = useActionData();

  return (
    <div className="admin-page">
      <div className="admin-card">
        <h1>Live Globe</h1>
        <p className="subtitle">Sign in to the admin panel</p>

        <Form method="post" className="admin-form">
          {actionData?.error && (
            <p className="admin-error">{actionData.error}</p>
          )}

          <label>
            Username
            <input
              type="text"
              name="username"
              autoComplete="username"
              autoFocus
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="admin-btn">
            Sign in
          </button>
        </Form>
      </div>
    </div>
  );
}
