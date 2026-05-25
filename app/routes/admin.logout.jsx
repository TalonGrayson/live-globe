import { redirect } from "@remix-run/node";
import { getSession, destroySession } from "../sessions.server";

export async function action({ request }) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/admin/login", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}
