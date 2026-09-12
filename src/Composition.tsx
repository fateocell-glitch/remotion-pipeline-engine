import {AbsoluteFill, CalculateMetadataFunction, Composition} from "remotion";
import {TechCard} from "./components/TechCard";
import {
  JasonWuComposition,
  JasonWuLongComposition,
  JasonWuTestComposition,
  ZhuzigeFullComposition,
  ZhuzigeTailDraftComposition,
  ZhuzigeEditorDraftComposition,
  ProjectEditorComposition,
} from "./JasonWu/JasonWuComposition";
import {ZhuzigeFullCompositionV2} from "./JasonWu/JasonWuCompositionV2";
import {JasonWuEffectDemo} from "./JasonWu/JasonWuEffectDemo";
import {JasonWuComponentCatalog} from "./JasonWu/JasonWuComponentCatalog";
import {componentCatalogDurationInFrames} from "./JasonWu/componentCatalog";
import {TechRemake9531} from "./TechRemake9531";
import {TechRemakeShousilang} from "./TechRemakeShousilang";
import {defaultProject, durationInFramesForProject} from "./JasonWu/projectLoader";
import type {VideoProject} from "./JasonWu/projectTypes";

type Props = {};

const calculateProjectMetadata: CalculateMetadataFunction<VideoProject> = ({props}) => ({
  durationInFrames: durationInFramesForProject(props),
  fps: props.fps,
  width: props.width,
  height: props.height,
});

const calculateMetadata: CalculateMetadataFunction<Props> = () => {
  return {};
};

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComponent}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="Tech9531"
        component={TechRemake9531}
        durationInFrames={9354}
        fps={24}
        width={1280}
        height={720}
      />
      <Composition
        id="TechShousilang"
        component={TechRemakeShousilang}
        durationInFrames={6983}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="JasonWu"
        component={JasonWuComposition}
        durationInFrames={1350}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="JasonWuTest"
        component={JasonWuTestComposition}
        durationInFrames={4050}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="JasonWuLong"
        component={JasonWuLongComposition}
        durationInFrames={7200}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="JasonWuEffectDemo"
        component={JasonWuEffectDemo}
        durationInFrames={2700}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="JasonWuComponentCatalog"
        component={JasonWuComponentCatalog}
        durationInFrames={componentCatalogDurationInFrames(30)}
        fps={30}
        width={1920}
        height={1080}
      /><Composition
        id="ZhuzigeFull"
        component={ZhuzigeFullComposition}
        durationInFrames={13279}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ZhuzigeFullV2"
        component={ZhuzigeFullCompositionV2}
        durationInFrames={13279}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ZhuzigeTailDraft"
        component={ZhuzigeTailDraftComposition}
        durationInFrames={13279}
        fps={30}
        width={1920}
        height={1080}
      />      <Composition
        id="ProjectEditor"
        component={ProjectEditorComposition}
        defaultProps={defaultProject}
        durationInFrames={durationInFramesForProject(defaultProject)}
        fps={defaultProject.fps}
        width={defaultProject.width}
        height={defaultProject.height}
        calculateMetadata={calculateProjectMetadata}
      />      <Composition
        id="ZhuzigeEditorDraft"
        component={ZhuzigeEditorDraftComposition}
        durationInFrames={13279}
        fps={30}
        width={1920}
        height={1080}
      />    </>
);
};

export const MyComponent: React.FC<Props> = () => {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        backgroundColor: "transparent",
        justifyContent: "center",
      }}
    >
      <TechCard
        title="Neural Render Index"
        value={98642}
        unit="OPS"
        chips={["HUD", "FUI", "ALPHA"]}
        accent="#FFE600"
      />
    </AbsoluteFill>
  );
};













