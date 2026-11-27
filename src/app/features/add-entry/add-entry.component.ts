import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, linkedSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SpendingsStore } from '@core/state';

import { PageHeaderComponent } from '@shared/components';
import { toIsoDate } from '@shared/helpers';

import { EntryType } from './enums';
import { categorySuggestions, createEntry } from './helpers';

const MIN_AMOUNT = 0.01;

/** Page for adding one spending or income: amount, category and date. */
@Component({
  selector: 'app-add-entry',
  imports: [PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './add-entry.component.html',
  styleUrl: './add-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEntryComponent implements OnInit {
  /** Bound from the `:type` route parameter. */
  readonly type = input<string>(EntryType.Spending);

  protected readonly entryType = EntryType;
  protected readonly form = new FormGroup({
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(MIN_AMOUNT)]),
    category: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    date: new FormControl(toIsoDate(new Date()), { nonNullable: true, validators: Validators.required }),
  });

  private readonly store = inject(SpendingsStore);
  private readonly router = inject(Router);

  protected readonly selectedType = linkedSignal<EntryType>(() =>
    this.type() === EntryType.Income ? EntryType.Income : EntryType.Spending,
  );
  protected readonly heading = computed(() =>
    this.selectedType() === EntryType.Income ? 'Add income' : 'Add spending',
  );
  protected readonly suggestions = computed(() => categorySuggestions(this.store.spendings(), this.selectedType()));
  protected readonly currency = computed(() => this.store.spendings().at(-1)?.convertedCurrency ?? '');
  protected readonly error = this.store.error;

  ngOnInit(): void {
    void this.store.load();
  }

  selectType(type: EntryType): void {
    this.selectedType.set(type);
  }

  pickCategory(category: string): void {
    this.form.controls.category.setValue(category);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { amount, category, date } = this.form.getRawValue();
    const entry = createEntry(this.store.spendings(), {
      type: this.selectedType(),
      amount: amount ?? 0,
      category,
      date,
    });
    if (await this.store.add(entry)) {
      await this.router.navigateByUrl('/');
    }
  }
}
