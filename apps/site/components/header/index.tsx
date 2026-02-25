import { HeaderMobile } from './mobile';
import { HeaderPC } from './pc';

export function Header() {
  return (
    <div className="font-onest">
      <HeaderPC />
      <HeaderMobile />
    </div>
  );
}
