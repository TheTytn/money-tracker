import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { SpendingsStore } from '@core/state';

@Component({
  selector: 'app-home',
  imports: [DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
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
