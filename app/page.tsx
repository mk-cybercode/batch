import Intro from "@/components/fx/Intro";
import ProgressBar from "@/components/fx/ProgressBar";
import ScrollFX from "@/components/fx/ScrollFX";
import Marquee from "@/components/fx/Marquee";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import FlavourRail from "@/components/FlavourRail";
import Concept from "@/components/sections/Concept";
import WhyModel from "@/components/sections/WhyModel";
import ProductFeature from "@/components/sections/ProductFeature";
import Economics from "@/components/sections/Economics";
import FinancialSummary from "@/components/sections/FinancialSummary";
import SalesTargets from "@/components/sections/SalesTargets";
import Channels from "@/components/sections/Channels";
import Timeline from "@/components/sections/Timeline";
import Vision from "@/components/sections/Vision";
import Ask from "@/components/sections/Ask";
import Risks from "@/components/sections/Risks";
import Closing from "@/components/sections/Closing";
import Footer from "@/components/sections/Footer";

export default function Page() {
  return (
    <>
      <Intro />
      <ProgressBar />
      <ScrollFX />
      <Nav />
      <Hero />
      <main>
        <Marquee text="Small batch gelato makers" speed={-0.35} />
        <Concept />
        <WhyModel />
        <FlavourRail />
        <ProductFeature />
        <Economics />
        <FinancialSummary />
        <SalesTargets />
        <Channels />
        <Timeline />
        <Marquee text="Good moments. Good memories." speed={0.3} />
        <Vision />
        <Ask />
        <Risks />
      </main>
      <Closing />
      <Footer />
    </>
  );
}
