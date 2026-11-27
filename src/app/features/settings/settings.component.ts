import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { SpendingsStore } from '@core/state';

import { PageHeaderComponent } from '@shared/components';

/** Settings: the stored data file and the open, create and download actions. */
@Component({
  selector: 'app-settings',
  imports: [DatePipe, DecimalPipe, PageHeaderComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  protected readonly store = inject(SpendingsStore);

  ngOnInit(): void {
    void this.store.load();
  }

  async openFile(input: HTMLInputElement): Promise<void> {
    const picked = input.files?.[0];
    input.value = '';
    if (picked) {
      await this.store.open(picked);
    }
  }
}
