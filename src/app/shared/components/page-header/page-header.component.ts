import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SideMenuService } from '@core/layout';

/** Top bar of a page: a menu button (or a back link when `backLink` is set) and the page heading. */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly heading = input.required<string>();
  readonly backLink = input<string>();

  protected readonly menu = inject(SideMenuService);
}
