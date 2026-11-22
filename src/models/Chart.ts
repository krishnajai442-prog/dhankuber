import mongoose, { Document, Model, Schema } from "mongoose";

export interface IChart extends Document {
  chartName: string;
  result: string;
  openingResult?: string;
  closingResult?: string;
  date: number;
  month: number;
  year: number;
  displayOrder: number;
  isHighlighted: boolean;
  isActive: boolean;
  scheduledAt?: Date; // When the result should be published
  drawTime?: string;  // 24h "HH:MM" — admin-set reveal time
  createdAt: Date;
  updatedAt: Date;
  formattedDate: string;
}

const chartSchema = new Schema<IChart>(
  {
    chartName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // Blank is allowed: pre-create the table now, publish the number later.
    result: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },
    openingResult: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    closingResult: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    date: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2012,
      max: 2030,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    scheduledAt: {
      type: Date,
    },
    drawTime: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

chartSchema.index({ chartName: 1 });
chartSchema.index({ date: 1, month: 1, year: 1 });
chartSchema.index({ year: 1, month: 1, date: 1 });
chartSchema.index({ isActive: 1 });
chartSchema.index({ isHighlighted: 1 });
chartSchema.index({ displayOrder: 1 });
chartSchema.index({ chartName: 1, year: 1, month: 1, date: 1 }, { unique: true });

chartSchema.virtual("formattedDate").get(function (this: IChart) {
  return `${this.date.toString().padStart(2, "0")}/${this.month.toString().padStart(2, "0")}/${this.year}`;
});

chartSchema.set("toJSON", { virtuals: true });
chartSchema.set("toObject", { virtuals: true });

const Chart: Model<IChart> = mongoose.models.Chart || mongoose.model<IChart>("Chart", chartSchema);
export default Chart;