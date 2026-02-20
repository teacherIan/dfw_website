import { BabylonScene } from './components/babylon';
import './index.css';

export function BabylonTest() {
  return (
    <div className="w-screen h-screen bg-black">
      <BabylonScene splatUrl="/assets/v_one_final.spz" />
    </div>
  );
}

export default BabylonTest;
