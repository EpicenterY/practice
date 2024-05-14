const jscad = require('@jscad/modeling')
const { cuboid, cylinder, circle, ellipsoid , rectangle, roundedRectangle, sphere } = jscad.primitives
const { subtract, union } = jscad.booleans
const { colorize, hslToRgb, colorNameToRgb } = jscad.colors
const { extrudeLinear} = jscad.extrusions
const { geom2 } = jscad.geometries
const { hullChain } = jscad.hulls
const { mat4 } = jscad.maths
const { vectorText } = jscad.text
const { translate, scale, rotateY, rotateZ, center } = jscad.transforms

const options = { segments: 32 }

const getParameterDefinitions = () => [
  //목재 선택
  { name: 'woodSelection', type: 'group', caption: '목재 선택'},
  { name: 'type', type: 'choice', caption: '목재 종류 :',
    values: [1, 2, 3, 4, 5],
    captions: ['미송집성목', '삼나무집성목', '멀바우집성목', '아카시아집성목', '스프러스집성목'],
    initial: '1'
  },
  //목재 크기설정
  { name: 'thk', type: 'choice', caption: '목재 두께 :',
    values: [4.5, 15, 18, 24, 30],
    captions: ['4.5mm', '15mm', '18mm', '24mm', '30mm'],
    initial: '15'
  },
  { name: 'width', type: 'int', initial: 300, caption: '길이(결방향) :' },
  { name: 'dp', type: 'int', initial: 300, caption: '폭 :' },
  { name: 'quantity', type: 'int', caption: '주문수량 :',
    values: [4.5, 15, 18, 24, 30],
    captions: ['4.5mm', '15mm', '18mm', '24mm', '30mm'],
    initial: '15'
  },
  //원점표시
  { name: 'originEn', type: 'checkbox', caption: '원점 표시', checked: true }, 

  //후가공 추가
  //밑단홈파기
  { name: 'bottomSlot', type: 'group', caption: '밑단홈파기'},
  { name: 'bottomSlotEn', type: 'checkbox', caption: '밑단홈파기적용', checked: false },
  { name: 'bottomSlotDist', type: 'int', initial: 10, caption: '간격 :' },
  { name: 'bottomSlotDp', type: 'int', initial: 5, caption: '깊이 :' },
  //두께홈따기
  { name: 'ThkPocket', type: 'group', caption: '두께홈따기'},
  { name: 'thkPocketEn', type: 'checkbox', caption: '두께홈따기적용', checked: false },
  { name: 'thkPocketWidth', type: 'int', initial: 20, caption: '폭 :' },
  { name: 'thkPocketThk', type: 'int', initial: 10, caption: '깊이 :' },
  //두께홈파기
  { name: 'thkSlot', type: 'group', caption: '두께홈파기'},
  { name: 'thkSlotEn',type:'checkbox',caption:'두께홈파기적용', checked: false },
  { name: 'thkSlotWidth', type: 'int', initial: 5, caption: '폭 :' },
  { name: 'thkSlotDp', type: 'int', initial: 10, caption: '깊이 :' },
  //모서리라운딩
  { name: 'cornerRound', type: 'group', caption: '모서리라운딩'},
  { name: 'cornerRoundEn', type: 'checkbox', caption: '모서리라운딩적용', checked: false },
  { name: 'cornerRoundRadius', type: 'int', initial: 15, caption: '라운드 반지름 :' },
  { name: 'cornerRoundAEn', type: 'checkbox', caption: 'A', checked: true },
  { name: 'cornerRoundBEn', type: 'checkbox', caption: 'B', checked: true },
  { name: 'cornerRoundCEn', type: 'checkbox', caption: 'C', checked: true },
  { name: 'cornerRoundDEn', type: 'checkbox', caption: 'D', checked: true },
  //원형타공 (Circle-cut)
  { name: 'circleCut', type: 'group', caption: '원형타공'},
  { name: 'circleCutEn', type: 'checkbox', caption: '원형타공적용', checked: false },
  { name: 'circleCutDisX', type: 'int', initial: 100, caption: '가로 간격 :' },
  { name: 'circleCutDisY', type: 'int', initial: 100, caption: '세로 간격 :' },
  { name: 'circleCutDia', type: 'int', initial: 35, caption: '원지름 :' },
  //사각타공 (Square-Cut)
  { name: 'squareCut', type: 'group', caption: '사각타공'},
  { name: 'squareCutEn', type: 'checkbox', caption: '사각타공적용', checked: false },
  { name: 'squareCutDisX', type: 'int', initial: 200, caption: '가로 간격 :' },
  { name: 'squareCutDisY', type: 'int', initial: 200, caption: '세로 간격 :' },
  { name: 'rectWidth', type: 'int', initial: 50, caption: '길이 :' },
  { name: 'rectDp', type: 'int', initial: 50, caption: '폭 :' },
  //모서리사선커팅
  { name: 'thkAngleCut', type: 'group', caption: '모서리사선커팅'},
  { name: 'thkAngleCutEn',type:'checkbox',caption:'모서리사선커팅적용', checked: false },
  { name: 'thkAngleCutOption',type: 'radio', caption: 'Radio Buttons:', values: ['both', 'left', 'right' ],
  captions: ['양쪽', '왼쪽', '오른쪽'], initial: 'both' },


  //그룹하나 끝
  { name: 'boring', type: 'group', caption: '싱크대보링'},
  { name: 'boringEn',type:'checkbox',caption:'싱크대보링적용', checked: false },
  { name: 'sholeX', type: 'int', initial: 50, caption: 'Hole X Position:' },
  //그룹하나 끝
  { name: 'conuterSink', type: 'group', caption: '피스타공'},
  { name: 'cornerHolesEn', type:'checkbox', caption:'피스타공적용', checked: false}
]

const createBase = (width, dp, thk) => {
  const base = cuboid({ size: [width, dp, thk] })
  return translate([0, 0, thk / 2], base)
}

const text = (message, extrusionHeight, characterLineWidth) => {
  if (message === undefined || message.length === 0) return []

  const lineRadius = characterLineWidth / 2
  const lineCorner = circle({ radius: lineRadius })

  const lineSegmentPointArrays = vectorText({ x: 0, y: 0, input: message }) // line segments for each character
  const lineSegments = []
  lineSegmentPointArrays.forEach((segmentPoints) => { // process the line segment
    const corners = segmentPoints.map((point) => translate(point, lineCorner))
    lineSegments.push(hullChain(corners))
  })
  const message2D = union(lineSegments)
  const message3D = extrudeLinear({ height: extrusionHeight }, message2D)
  return center({ axes: [true, true, false] }, message3D)
}

const createSizeText = (width, dp, thk) => {
  const sizeText = `${width}mm X ${dp}mm X ${thk}T`
  const sizeTextStr = sizeText.toString()
  if (sizeText.length === 0) {
    return []
  }
  let sizeText3D = text(sizeText.toString(), 2, 1)
  sizeText3D = scale([0.5, 0.5, 0.5], sizeText3D)
  sizeText3D = translate([0, 0, 0], sizeText3D)
  return sizeText3D
}

//원점표시
const createOrigin = (width, dp, thk) => {
  const originSphere = colorize([1,0,0],sphere({radius : 2, segment : 32}))
  const originBigSphere = colorize([1,0,0,0.5],sphere({radius : 4, segment : 128}))
  const origin = translate([-width/2, -dp/2, thk],[originSphere,originBigSphere])
  return origin
}

//밑단홈파기
const createbottomSlot = (width, dp, bottomSlotDist, bottomSlotDp, thk) => {
  const bottomSlotCuboid = cuboid({size:[width, 5, bottomSlotDp]})
  return translate([0, - dp / 2 + bottomSlotDist + 2.5, thk - bottomSlotDp/2],
  bottomSlotCuboid)
}

//두께홈따기
const createThkPocket = (width, dp, thk, thkPocketWidth, thkPocketThk) =>{
  const thkPocketCuboid = cuboid({size:[width, thkPocketWidth, thkPocketThk]})
  return translate([0, - dp / 2 + thkPocketWidth /2 , thk - thkPocketThk/2],
  thkPocketCuboid)
}

//두께홈파기
const createThkSlot = (width, dp, thk, thkSlotWidth, thkSlotDp) => {
  const thkSlotCuboid = cuboid({size : [width, thkSlotDp, thkSlotWidth]})
  return translate([0, - dp / 2 + thkSlotDp/2, thk /2],thkSlotCuboid)
}

//모서리라운딩
const createCornerRound = (width, dp, thk, cornerRoundRadius, cornerRoundAEn, cornerRoundBEn, cornerRoundCEn, cornerRoundDEn) => {
  const cylinder = circle({radius : cornerRoundRadius, center: [-cornerRoundRadius, -cornerRoundRadius],
     segment: options.segments})
  const cylinder3D = extrudeLinear({height : thk}, cylinder)
  const roundBox = rectangle({size : [cornerRoundRadius*2, cornerRoundRadius*2]});
  const roundBox3D = extrudeLinear({height : thk}, roundBox)
  const cornerCutBox = subtract(roundBox3D, cylinder3D)
  const cornerCutBoxs = [];
  if(cornerRoundAEn){
    cornerCutBoxs.push(translate([-width/2, dp/2, 0], rotateZ(Math.PI / 2, cornerCutBox))); // A
  }
  if(cornerRoundBEn){
    cornerCutBoxs.push(translate([-width/2, -dp/2, 0], rotateZ(Math.PI , cornerCutBox))); // B
  }
  if(cornerRoundCEn){
    cornerCutBoxs.push(translate([width/2, dp/2, 0], cornerCutBox)); // C
  }
  if(cornerRoundDEn){
    cornerCutBoxs.push(translate([width/2, -dp/2, 0], rotateZ(-Math.PI / 2, cornerCutBox))); // D
  }
  return cornerCutBoxs;
}

//원형타공
const createCircleCut = (width, dp, thk, circleCutDisX, circleCutDisY, circleCutDia) => {
  const circleCut = circle({ radius: circleCutDia / 2, center: [-width / 2 + circleCutDisX, -dp / 2 + circleCutDisY], segments: options.segments })
  const circleCut3D = extrudeLinear({ height: thk*2 }, circleCut)
  return circleCut3D
}
const createCircleCutMulti = (width, dp, thk, circleCutArray) => {
  const hole3DMulti = [];
  // parameter가 배열로 넘어왔을때
  circleCutArray.forEach((el) => {
    let hole =  circle({ radius: el.circleCutDiameter / 2, center: [el.circleCutDisX, el.circleCutDisY], segments: options.segments });
    let hole3D = extrudeLinear({ height: thk*2 }, hole);
    hole3DMulti.push(hole3D);
  });
  return hole3DMulti;
}

//사각타공
const createSquareCut = (width, dp, thk, squareCutDisX, squareCutDisY, rectWidth, rectDp) => {
  const rect = roundedRectangle({ size: [rectWidth, rectDp], roundRadius :2.5 });
  const rect3D = extrudeLinear({ height: thk }, rect);
  return translate([-width / 2 + squareCutDisX + rectWidth / 2, - dp / 2 + squareCutDisY + rectDp / 2, 0], rect3D);
}

//모서리사선커팅
const createThkAngleCut = (width, dp, thk, thkAngleCutOption) =>{
  const thkAngleCutCuboid = cuboid({size : [thk * 2 , dp, thk * 2]})
  const thkAngleCutCuboids = [];
  if(thkAngleCutOption === 'left' ){
    thkAngleCutCuboids.push( translate([-width / 2, 0, thk * Math.sqrt(2)], rotateY(Math.PI / 4, thkAngleCutCuboid)))
  }
  if(thkAngleCutOption === 'right' ){
    thkAngleCutCuboids.push( translate([ width / 2, 0, thk * Math.sqrt(2)], rotateY(Math.PI / 4, thkAngleCutCuboid)))
  }
  if(thkAngleCutOption === 'both'){
    thkAngleCutCuboids.push( translate([-width / 2, 0, thk * Math.sqrt(2)], rotateY(Math.PI / 4, thkAngleCutCuboid)))
    thkAngleCutCuboids.push( translate([ width / 2, 0, thk * Math.sqrt(2)], rotateY(Math.PI / 4, thkAngleCutCuboid)))
  }
  return thkAngleCutCuboids
}



const createBoringCut = (width, dp, thk, sholeX) => {
  const hole = circle({ radius: 35/2, center: [-width/2 + sholeX, 0], segments: options.segments })
  const hole3D = extrudeLinear({ height: 50 }, hole)
  return translate([0, -dp/2 + 23, thk -13], hole3D);
}

const createCornerHoles = (width, dp, thk) => {
  const holeRadius = 2; // 피스타공 4mm
  const hole = circle({ radius: holeRadius, segments: 64 });
  const hole3D = extrudeLinear({ height: thk*2 }, hole) // 박스를 완전히 관통하기 위해 두께보다 더 높게 설정}


  // 네 모서리에 구멍을 위치시킵니다.
  const holes = [
    translate([-width/2 + 10, dp/2 -10, 0], hole3D),
    translate([-width/2 + 10, -dp/2 +10, 0], hole3D),
    translate([width/2 - 10, dp/2 -10, 0], hole3D),
    translate([width/2 - 10, -dp/2 +10, 0], hole3D)
  ];

  return holes;
}



const main = ({
  width, dp, thk, //기본치수
  originEn, //원점
  bottomSlotDist, bottomSlotDp, bottomSlotEn, //밑단홈파기
  thkPocketWidth, thkPocketThk, thkPocketEn, //두께홈따기
  thkSlotWidth, thkSlotDp, thkSlotEn, //두께홈파기
  cornerRoundRadius, cornerRoundAEn, cornerRoundBEn, cornerRoundCEn, cornerRoundDEn, cornerRoundEn, //모서리라운딩
  circleCutDisX, circleCutDisY, circleCutDia, circleCutEn, //원형타공
  squareCutDisX, squareCutDisY, rectWidth, rectDp, squareCutEn, //사각타공
  thkAngleCutOption, thkAngleCutEn, //모서리사선커팅
  cornerHolesEn, boringEn, sholeX,
  circleCutArray
}) => {
  const base = createBase(width, dp, thk);
  let modifiedBase = base;

  if (bottomSlotEn) {
    const bottomSlot = createbottomSlot(width, dp, bottomSlotDist, bottomSlotDp, thk);
    modifiedBase = subtract(modifiedBase, bottomSlot);
  }
  if (thkPocketEn){
    const thkPocket = createThkPocket(width, dp, thk, thkPocketWidth, thkPocketThk);
    modifiedBase = subtract(modifiedBase, thkPocket);
  }
  if (thkSlotEn){
    const thkSlot = createThkSlot(width, dp, thk, thkSlotWidth, thkSlotDp);
    modifiedBase = subtract(modifiedBase, thkSlot);
  }
  if (cornerRoundEn) {
    const cornerRound = createCornerRound (width, dp, thk, cornerRoundRadius, cornerRoundAEn, cornerRoundBEn, cornerRoundCEn, cornerRoundDEn);
    cornerRound.forEach((createCornerRoundItem) => {
      modifiedBase = subtract(modifiedBase, createCornerRoundItem);
    });
  }
  if (circleCutEn) {
    const circleCut = createCircleCut(width, dp, thk, circleCutDisX, circleCutDisY, circleCutDia);
    modifiedBase = subtract(modifiedBase, circleCut);
  }
  // 원형타공 multi 옵션
  if (circleCutEn) {
    // parameter 배열이면서 요소가 1개 이상 체크
    if (Array.isArray(circleCutArray) && circleCutArray.length > 0) {
      const holeCutMulti = createCircleCutMulti(width, dp, thk, circleCutArray);
      holeCutMulti.forEach((holeCut) => {
        modifiedBase = subtract(modifiedBase, holeCut);
      });
    }
  }
  if (squareCutEn) {
    const squareCut = createSquareCut(width, dp, thk, squareCutDisX, squareCutDisY, rectWidth, rectDp);
    modifiedBase = subtract(modifiedBase, squareCut);
  }
  if (thkAngleCutEn){
    const thkCut = createThkAngleCut(width, dp, thk, thkAngleCutOption);
    thkCut.forEach((createThkAngleCutItem) => {
      modifiedBase = subtract(modifiedBase, createThkAngleCutItem);
    });
  }

  if (cornerHolesEn) {
    const cornerHoles = createCornerHoles(width, dp, thk);
    modifiedBase = cornerHoles.reduce((acc, hole) => subtract(acc, hole), modifiedBase);
  }



  if (boringEn) {
    const boringCut = createBoringCut(width, dp, thk, sholeX);
    modifiedBase = subtract(modifiedBase, boringCut);
  }


  const sizeText3D = createSizeText(width, dp, thk);
  const positionedText = translate([0, 0, thk], sizeText3D);
  const originM = createOrigin(width, dp, thk);

  const woodScene = [];

  woodScene.push(colorize([0.5, 1, 1], modifiedBase));
  woodScene.push(colorize([0, 0, 0], positionedText));

  if (originEn) {
    woodScene.push(originM)
  }

  return woodScene;
}

module.exports = { main, getParameterDefinitions }