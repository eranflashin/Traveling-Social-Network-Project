import { notify } from "react-notify-toast";

export default function notAuth(history) {
  notify.show("Login Timed Out, Redirecting to Login Page", "error", 3000);
  localStorage.clear();
  history.push("/");
}
