// lib/templates.js
export function staticTemplate({ headline='Your Headline', paletteColor='#8A5BFF' }={}){
  return {
    timeline:{ background:'#000000', tracks:[{ clips:[{ asset:{ type:'title', text:headline, style:'minimal', color:paletteColor, size:'medium' }, start:0, length:5, position:'center' }]}]},
    output:{ format:'mp4', resolution:'sd' }
  };
}
