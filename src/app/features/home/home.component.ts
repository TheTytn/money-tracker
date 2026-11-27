import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SpendingsStore } from '@core/state';

import { PageHeaderComponent } from '@shared/components';
import { addMonths, toIsoMonth } from '@shared/helpers';

import { CategoryChartComponent } from './components';
import { categoryTotals } from './helpers';

/** Main page: spendings of a month by category, plus shortcuts to add a spending or an income. */
@Component({
  selector: 'app-home',
  imports: [DatePipe, RouterLink, CategoryChartComponent, PageHeaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  protected readonly store = inject(SpendingsStore);

  protected readonly month = signal(toIsoMonth(new Date()));
  /** First day of the month, for the date pipe. */
  protected readonly monthStart = computed(() => `${this.month()}-01T00:00:00`);
  protected readonly totals = computed(() => categoryTotals(this.store.spendings(), this.month()));
  /** Main currency, taken from the most recent row. */
  protected readonly currency = computed(() => this.store.spendings().at(-1)?.convertedCurrency ?? '');

  ngOnInit(): void {
    void this.store.load();
  }

  previousMonth(): void {
    this.month.update((month) => addMonths(month, -1));
  }

  nextMonth(): void {
    this.month.update((month) => addMonths(month, 1));
  }
}
