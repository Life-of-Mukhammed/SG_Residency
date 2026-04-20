import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDaySchedule {
  enabled: boolean;
  slots: { start: string; end: string }[];
}

export interface ISchedule extends Document {
  managerId: mongoose.Types.ObjectId;
  timezone: string;
  monday:    IDaySchedule;
  tuesday:   IDaySchedule;
  wednesday: IDaySchedule;
  thursday:  IDaySchedule;
  friday:    IDaySchedule;
  saturday:  IDaySchedule;
  sunday:    IDaySchedule;
  slotDuration: number; // minutes per slot (default 30)
  createdAt: Date;
  updatedAt: Date;
}

const DaySchema = new Schema<IDaySchedule>({
  enabled: { type: Boolean, default: false },
  slots:   [{ start: String, end: String }],
}, { _id: false });

const ScheduleSchema = new Schema<ISchedule>(
  {
    managerId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    timezone:     { type: String, default: 'Asia/Tashkent' },
    monday:       { type: DaySchema, default: { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] } },
    tuesday:      { type: DaySchema, default: { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] } },
    wednesday:    { type: DaySchema, default: { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] } },
    thursday:     { type: DaySchema, default: { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] } },
    friday:       { type: DaySchema, default: { enabled: true,  slots: [{ start: '09:00', end: '17:00' }] } },
    saturday:     { type: DaySchema, default: { enabled: false, slots: [] } },
    sunday:       { type: DaySchema, default: { enabled: false, slots: [] } },
    slotDuration: { type: Number, default: 30 },
  },
  { timestamps: true }
);

const Schedule: Model<ISchedule> =
  (mongoose.models.Schedule as Model<ISchedule>) ||
  mongoose.model<ISchedule>('Schedule', ScheduleSchema);

export default Schedule;
