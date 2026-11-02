import { useEffect } from "react";
import { usePatients } from "../context/PatientsContext.jsx";

/**
 * The patient for an id — from the cache if known, otherwise fetched. Returns
 * null until available, so pages can render a heading without the name first.
 * (This is what makes deep links like /patients/:id/log show the name.)
 */
export function usePatient(id) {
  const { patients, getOrFetchPatient } = usePatients();
  const patient = patients.find((p) => p._id === id) || null;

  useEffect(() => {
    if (id && !patient) getOrFetchPatient(id).catch(() => {});
  }, [id, patient, getOrFetchPatient]);

  return patient;
}
