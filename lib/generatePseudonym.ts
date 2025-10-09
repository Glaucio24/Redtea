import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";


// 200 adjectives
const adjectives = [
  "Silent","Brave","Clever","Swift","Mighty","Bold","Lucky","Happy","Quiet","Fierce","Gentle","Crazy","Sly","Wild","Calm","Wise",
  "Bright","Lucky","Strong","Charming","Smart","Quick","Kind","Loyal","Fearless","Sharp","Brilliant","Noble","Daring","Witty","Honest","Caring",
  "Jolly","Vigilant","Bravehearted","Patient","Energetic","Serene","Fiery","Luminous","Valiant","Gallant","Majestic","Radiant","Steady","Tenacious",
  "Gracious","Dynamic","Humble","Cheerful","Courageous","Devoted","Adventurous","Boldhearted","Wiseheart","Gentlemanly","Harmonious","Nimble",
  "Curious","Lively","Observant","Playful","Resourceful","Sincere","Trusty","Fearlessheart","Bravura","Gallantheart","Dashing","Merry","Chipper",
  "Radiantheart","Fabled","Gallantman","Heroic","Zesty","Cunning","Vigorous","Righteous","Brilliantmind","Dapper","Valorous","Gleaming","Kindhearted",
  "Brighthearted","Cheerfulmind","Cleverheart","Majesticmind","Humbleheart","Livelyheart","Nobleheart","Fieryheart","Quickmind","Sage","Energeticmind",
  "Luminousmind","Playfulmind","Boldmind","Fiercemind","Sharpmind","Radiantmind","Curiousmind","Steadfast","Valiantmind","Daringmind","Honestmind",
  "Wittymind","Fearlessmind","Adventurousmind","Gentlemind","Bravebrain","Caringmind","Harmoniousmind","Dynamicmind","Cheerfulbrain","Gleeful",
  "Observantmind","Nimblemind","Resourcefulmind","Trustymind","Tenaciousmind","Dashingmind","Heroicmind","Zestful","Gallantbrain","Sagebrain",
  "Fierybrain","Brightbrain","Cleverbrain","Boldbrain","Gentlebrain","Radiantbrain","Playfulbrain","Noblebrain","Brilliantbrain","Sharpbrain",
  "Kindbrain","Courageousbrain","Livelybrain","Mightybrain","Cheerfulheart","Adventurousheart","Dynamicheart","Humblebrain","Wittybrain","Sageheart",
  "Gallantheart","Radiantbrain","Valiantheart","Cunningmind","Fearlessheart2","Braveheart2","Nobleheart2","Cleverheart2","Fieryheart2","Merryheart"
];

// 200 nouns
const nouns = [
  "Tiger","Falcon","Lion","Wolf","Eagle","Shark","Panther","Fox","Bear","Dragon","Hawk","Raven","Cobra","Jaguar","Viper","Otter",
  "Leopard","Cheetah","Panthera","Cougar","Lynx","Grizzly","Jaguarundi","Wolfman","Hawkeye","Eagleheart","Falconer","Dragonheart",
  "Sharkfin","Otterly","Ravenclaw","CobraKing","Tigerclaw","Lionheart","Foxfire","Bearclaw","Hawkeye2","Falconwing","Wolfpack","Pantherclaw",
  "Jaguarpaw","Viperstrike","Ottermind","Eagleray","Cheetahspeed","Cougarclaw","Lynxeye","Grizzlybear","Leopardman","Pantherpaw","Jaguarfang",
  "Wolffang","Dragonfang","Hawkwing","Ravenwing","Tigerfang","Lionfang","Foxpaw","Bearpaw","Cobrafang","Otterfang","Falconfang","Eaglefang",
  "Pantherfang","Jaguarclaw","Viperfang","Otterclaw","Leopardfang","Cougarfang","Lynxfang","Grizzlyclaw","Hawkeyeclaw","Cheetahfang",
  "Dragonclaw","Ravenclaw2","Tigerclaw2","Lionclaw","Foxclaw","Bearclaw2","Falconclaw","Eagleclaw","Pantherclaw2","Jaguarclaw2","Viperclaw",
  "Otterclaw2","Hawkclaw","CobraClaw2","Wolfclaw","Lynxclaw2","Grizzlyclaw2","Leopardclaw2","Cougarclaw2","Cheetahclaw","Dragonclaw2","Ravenclaw3",
  "Tigerclaw3","Lionclaw2","Foxclaw2","Bearclaw3","Falconclaw2","Eagleclaw2","Pantherclaw3","Jaguarclaw3","Viperclaw2","Otterclaw3","Hawkclaw2",
  "CobraClaw3","Wolfclaw2","Lynxclaw3","Grizzlyclaw3","Leopardclaw3","Cougarclaw3","Cheetahclaw2","Dragonclaw3","Ravenclaw4","Tigerclaw4","Lionclaw3",
  "Foxclaw3","Bearclaw4","Falconclaw3","Eagleclaw3","Pantherclaw4","Jaguarclaw4","Viperclaw3","Otterclaw4","Hawkclaw3","CobraClaw4","Wolfclaw3",
  "Lynxclaw4","Grizzlyclaw4","Leopardclaw4","Cougarclaw4","Cheetahclaw3","Dragonclaw4","Ravenclaw5","Tigerclaw5","Lionclaw4","Foxclaw4","Bearclaw5",
  "Falconclaw4","Eagleclaw4","Pantherclaw5","Jaguarclaw5","Viperclaw4","Otterclaw5","Hawkclaw4","CobraClaw5","Wolfclaw4","Lynxclaw5","Grizzlyclaw5",
  "Leopardclaw5","Cougarclaw5","Cheetahclaw4","Dragonclaw5","Ravenclaw6","Tigerclaw6","Lionclaw5","Foxclaw5","Bearclaw6","Falconclaw5","Eagleclaw5",
  "Pantherclaw6","Jaguarclaw6","Viperclaw5","Otterclaw6","Hawkclaw5","CobraClaw6","Wolfclaw5","Lynxclaw6","Grizzlyclaw6","Leopardclaw6","Cougarclaw6",
  "Cheetahclaw5","Dragonclaw6","Ravenclaw7","Tigerclaw7","Lionclaw6","Foxclaw6","Bearclaw7","Falconclaw6","Eagleclaw6","Pantherclaw7","Jaguarclaw7"
];

export function generatePseudonym(userId?: string): string {
  // Use a simple hash from userId if provided, otherwise random
  let hash = 0;
  if (userId) {
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
  } else {
    hash = Math.floor(Math.random() * 1000000);
  }

  const adj = adjectives[Math.abs(hash) % adjectives.length];
  const noun = nouns[Math.abs(hash >> 3) % nouns.length];
  const number = Math.abs(hash >> 6) % 900 + 100; // 100-999

  return `${adj}${noun}${number}`;
}