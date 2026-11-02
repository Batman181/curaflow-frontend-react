import { useParams } from "react-router-dom";
import { DailyLogApi, PhysiotherapyApi, PrescriptionsApi, VitalsApi } from "../api";
import { useAsync } from "../hooks/useAsync.js";
import { usePatient } from "../hooks/usePatient.js";
import { asArray } from "../utils/data.js";
import DailyLogForm from "../components/dailylog/DailyLogForm.jsx";
import ErrorBox from "../components/common/ErrorBox.jsx";
import Skeleton from "../components/common/Skeleton.jsx";

export default function DailyLogPage() {
  const { id: patientId } = useParams();
  const patient = usePatient(patientId);

  const { data, error, loading } = useAsync(async () => {
    const [existingLog, existingVital, existingPhysio, currentMeds] = await Promise.all([
      DailyLogApi.today(patientId),
      VitalsApi.today(patientId).catch(() => null),
      PhysiotherapyApi.today(patientId).catch(() => null),
      PrescriptionsApi.current(patientId).catch(() => []),
    ]);
    return { existingLog, existingVital, existingPhysio, currentMeds: asArray(currentMeds) };
  }, [patientId]);

  if (error) return <ErrorBox>{error.message}</ErrorBox>;
  if (loading || !data) return <Skeleton height={400} />;
  // key: a different patient gets a fresh form, never the previous one's state.
  return <DailyLogForm key={patientId} patientId={patientId} patient={patient} {...data} />;
}
