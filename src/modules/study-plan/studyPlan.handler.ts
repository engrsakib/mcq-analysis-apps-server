export async function handleStudyPlanCreated(payload: {
  userId?: string;
  planId: string | number;
  title?: string;
}) {
  console.log("Study Plan Created:", payload.planId);
}
