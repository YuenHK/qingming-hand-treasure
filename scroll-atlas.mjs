// Small textures avoid uploading a 30,000-pixel image on older graphics cards.
export function createScrollAtlas({onUpdate=()=>{},makeImage=()=>new Image(),maxTiles=8}={}){
 const width=30000,height=926,tileWidth=2048,tiles=new Map();let stamp=0,ready=false;
 const preview=makeImage();preview.onload=()=>{ready=true;onUpdate();};preview.onerror=()=>onUpdate();preview.src='assets/scroll-tiles/preview.jpg';
 function request(index){
  if(index<0||index>=Math.ceil(width/tileWidth))return null;
  let tile=tiles.get(index);if(tile){tile.used=++stamp;return tile;}
  tile={image:makeImage(),ready:false,used:++stamp};tiles.set(index,tile);
  tile.image.onload=()=>{tile.ready=true;onUpdate();};tile.image.onerror=()=>{tile.failed=true;};
  tile.image.src=`assets/scroll-tiles/${String(index).padStart(2,'0')}.jpg`;
  return tile;
 }
 function drawPreview(ctx,x,y,w,h,dx,dy,dw,dh){if(!ready)return false;const pw=preview.naturalWidth||4096,ph=preview.naturalHeight||126;ctx.drawImage(preview,x/width*pw,y/height*ph,w/width*pw,h/height*ph,dx,dy,dw,dh);return true;}
 return {
  get ready(){return ready;},drawPreview,
  draw(ctx,x,y,w,h,dx,dy,dw,dh){
   if(!drawPreview(ctx,x,y,w,h,dx,dy,dw,dh))return false;
   const first=Math.floor(x/tileWidth),last=Math.floor(Math.min(width-1,x+w-1)/tileWidth);
   for(let i=first;i<=last;i++){
    const tile=request(i),left=Math.max(x,i*tileWidth),right=Math.min(x+w,(i+1)*tileWidth,width);
    if(tile.ready&&right>left)ctx.drawImage(tile.image,left-i*tileWidth,y,right-left,h,dx+(left-x)/w*dw,dy,(right-left)/w*dw,dh);
   }
   request(first-1);request(last+1);
   for(const [index,tile]of [...tiles].sort((a,b)=>a[1].used-b[1].used)){
    if(tiles.size<=maxTiles)break;
    if((index<first-1||index>last+1)&&tile.ready)tiles.delete(index);
   }
   return true;
  }
 };
}
