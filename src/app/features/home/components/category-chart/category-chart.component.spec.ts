import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryChartComponent } from './category-chart.component';

describe('CategoryChartComponent', () => {
  let fixture: ComponentFixture<CategoryChartComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CategoryChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(CategoryChartComponent);
    element = fixture.nativeElement as HTMLElement;
  });

  it('should draw one slice and one legend row per category with the total in the middle', async () => {
    fixture.componentRef.setInput('totals', [
      { category: 'Food', amount: 75, share: 0.75 },
      { category: 'Taxi', amount: 25, share: 0.25 },
    ]);
    fixture.componentRef.setInput('currency', 'UAH');
    await fixture.whenStable();

    expect(element.querySelectorAll('.chart__slice')).toHaveLength(2);
    expect(element.querySelector('[data-testid="chart-total"]')?.textContent).toContain('100.00');
    expect(element.textContent).toContain('Total, UAH');
    const rows = Array.from(element.querySelectorAll('.legend__item')).map((li) =>
      Array.from(li.querySelectorAll('span'))
        .map((span) => span.textContent?.trim())
        .filter(Boolean)
        .join(' '),
    );
    expect(rows).toEqual(['Food 75% 75.00', 'Taxi 25% 25.00']);
  });

  it('should start each slice where the previous one ends', async () => {
    fixture.componentRef.setInput('totals', [
      { category: 'A', amount: 1, share: 0.5 },
      { category: 'B', amount: 1, share: 0.5 },
    ]);
    await fixture.whenStable();

    const offsets = Array.from(element.querySelectorAll('.chart__slice')).map((c) =>
      Number(c.getAttribute('stroke-dashoffset')),
    );
    expect(offsets[0]).toBeCloseTo(0);
    expect(offsets[1]).toBeCloseTo(-Math.PI * 80);
  });
});
