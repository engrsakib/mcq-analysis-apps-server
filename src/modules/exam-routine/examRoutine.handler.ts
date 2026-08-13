export async function handleExamRoutineCreated(payload: {
  userId?: string;
  routineId: string | number;
  title?: string;
}) {
  console.log("Exam Routine Created:", payload.routineId);
}
