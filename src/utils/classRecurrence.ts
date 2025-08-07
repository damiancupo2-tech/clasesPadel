// src/utils/classRecurrence.ts

import { Class } from '../types';

export function generateRecurringClasses(cls: Class): Class[] {
  const classes: Class[] = [];
  const originalDate = new Date(cls.date);
  const endOfMonth = new Date(originalDate.getFullYear(), originalDate.getMonth() + 1, 0);

  let current = new Date(cls.date);
  const maxDate = endOfMonth;

  const increment = cls.repeating === 'weekly' ? 7 : cls.repeating === 'monthly' ? 30 : 0;

  while (increment > 0) {
    current = new Date(current.getTime() + increment * 24 * 60 * 60 * 1000);
    if (current > maxDate) break;

    classes.push({
      ...cls,
      id: `${cls.id}-${current.getTime()}`,
      date: new Date(current),
      parentId: cls.id,
      students: [...(cls.students || [])],
      attendances: {},
      status: 'scheduled',
      createdAt: new Date()
    });
  }

  return classes;
}
