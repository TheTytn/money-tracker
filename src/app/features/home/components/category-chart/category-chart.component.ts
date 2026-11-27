import { DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { CategoryTotal } from '../../models';

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SLICE_GAP = 2;
const COLOR_COUNT = 8;

interface ChartSlice extends CategoryTotal {
  color: string;
  dashArray: string;
  dashOffset: number;
}

/** Donut chart of spendings by category, with the total in the middle and a legend below. */
@Component({
  selector: 'app-category-chart',
  imports: [DecimalPipe, PercentPipe],
  templateUrl: './category-chart.component.html',
  styleUrl: './category-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryChartComponent {
  readonly totals = input.required<CategoryTotal[]>();
  readonly currency = input('');

  protected readonly radius = RADIUS;
  protected readonly total = computed(() => this.totals().reduce((sum, item) => sum + item.amount, 0));
  protected readonly slices = computed<ChartSlice[]>(() => {
    let offset = 0;
    const single = this.totals().length === 1;
    return this.totals().map((item, index) => {
      const length = item.share * CIRCUMFERENCE;
      const visible = single ? length : Math.max(length - SLICE_GAP, 0.5);
      const slice: ChartSlice = {
        ...item,
        color: `var(--chart-${(index % COLOR_COUNT) + 1})`,
        dashArray: `${visible} ${CIRCUMFERENCE - visible}`,
        dashOffset: -offset,
      };
      offset += length;
      return slice;
    });
  });
}
