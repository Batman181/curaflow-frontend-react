import { initials } from "../../utils/format.js";

export default function Avatar({ name, light = false }) {
  return <span className={`avatar-circle${light ? " avatar-circle--light" : ""}`}>{initials(name)}</span>;
}
