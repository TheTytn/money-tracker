import { TestBed } from '@angular/core/testing';

import { SideMenuService } from './side-menu.service';

describe('SideMenuService', () => {
  it('should open and close the menu', () => {
    const menu = TestBed.inject(SideMenuService);

    expect(menu.isOpen()).toBe(false);
    menu.open();
    expect(menu.isOpen()).toBe(true);
    menu.close();
    expect(menu.isOpen()).toBe(false);
  });
});
