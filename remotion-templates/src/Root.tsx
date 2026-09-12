import {Composition} from "remotion";
import AnimatedText from "../templates/animated-text";
import ChartAnimation from "../templates/chart-animation";
import GridPulse from "../templates/grid-pulse";
import LowerThird from "../templates/lower-third";
import MatrixRain from "../templates/matrix-rain";
import StatCounter from "../templates/stat-counter";

const sharedProps = {
  durationInFrames: 150,
  fps: 30,
  width: 1920,
  height: 1080,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="StatCounter"
        component={StatCounter}
        {...sharedProps}
      />
      <Composition
        id="ChartAnimation"
        component={ChartAnimation}
        {...sharedProps}
      />
      <Composition id="GridPulse" component={GridPulse} {...sharedProps} />
      <Composition id="LowerThird" component={LowerThird} {...sharedProps} />
      <Composition id="AnimatedText" component={AnimatedText} {...sharedProps} />
      <Composition id="MatrixRain" component={MatrixRain} {...sharedProps} />
    </>
  );
};
