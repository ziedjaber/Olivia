import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appUnreadBadge]',
  standalone: true
})
export class UnreadBadgeDirective implements OnChanges {

  @Input() appUnreadBadge = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    const badge = this.el.nativeElement;
    if (this.appUnreadBadge > 0) {
      this.renderer.setStyle(badge, 'display', 'flex');
      this.renderer.setProperty(
        badge,
        'textContent',
        this.appUnreadBadge > 99 ? '99+' : String(this.appUnreadBadge)
      );
    } else {
      this.renderer.setStyle(badge, 'display', 'none');
    }
  }
}