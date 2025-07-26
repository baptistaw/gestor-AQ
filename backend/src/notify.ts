// Por ahora solo deja un stub; luego lo conectaremos a FCM / Expo push…
export async function schedulePatientNotification(
  patientId: string,
  title: string,
  body: string,
  whenISO: string
) {
  console.log(
    `[notify] Programada → ${patientId}  |  ${whenISO}  |  ${title} – ${body}`
  );
}
