import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PatientsApi } from "../api";
import { useAuth } from "./AuthContext.jsx";

const PatientsContext = createContext(null);

/**
 * A small cache of patients the caregiver has seen, so page headings and the
 * sidebar can show a name without refetching on every navigation.
 */
export function PatientsProvider({ children }) {
  const { user } = useAuth();
  const [patients, setPatientsState] = useState([]);
  const patientsRef = useRef([]); // always-current copy for use inside async callbacks

  const setPatients = useCallback((next) => {
    patientsRef.current = next;
    setPatientsState(next);
  }, []);

  const addPatient = useCallback(
    (patient) => {
      const current = patientsRef.current;
      const exists = current.some((p) => p._id === patient._id);
      setPatients(exists ? current.map((p) => (p._id === patient._id ? patient : p)) : [...current, patient]);
    },
    [setPatients]
  );

  /** Resolves from the cache, or fetches (and caches) the patient by id. */
  const getOrFetchPatient = useCallback(
    async (id) => {
      const found = patientsRef.current.find((p) => p._id === id);
      if (found) return found;
      const fetched = await PatientsApi.get(id);
      if (fetched) addPatient(fetched);
      return fetched;
    },
    [addPatient]
  );

  // Forget everything when the caregiver logs out.
  useEffect(() => {
    if (!user) setPatients([]);
  }, [user, setPatients]);

  const value = useMemo(
    () => ({ patients, setPatients, addPatient, getOrFetchPatient }),
    [patients, setPatients, addPatient, getOrFetchPatient]
  );
  return <PatientsContext.Provider value={value}>{children}</PatientsContext.Provider>;
}

export function usePatients() {
  const ctx = useContext(PatientsContext);
  if (!ctx) throw new Error("usePatients must be used inside <PatientsProvider>");
  return ctx;
}
