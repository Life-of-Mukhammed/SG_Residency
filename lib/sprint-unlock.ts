type SprintTaskConfig = {
  _id: string;
  quarter: number;
  month: number;
};

type SprintProgressItem = {
  taskId: string;
  completed: boolean;
};

export function isGtmUnlockedBySprint(customTasks: SprintTaskConfig[], progressItems: SprintProgressItem[]) {
  const firstQuarterMonths = [1, 2, 3].map((month) =>
    customTasks.filter((task) => task.quarter === 1 && task.month === month)
  );

  if (firstQuarterMonths.some((tasks) => tasks.length === 0)) return false;

  const progressMap = new Map(progressItems.map((item) => [item.taskId, item.completed]));

  return firstQuarterMonths.every((tasks) =>
    tasks.every((task) => progressMap.get(`custom_${task._id}`) === true)
  );
}
