const jscad = require('@jscad/modeling')
const {line, cuboid, cylinder, circle, ellipsoid , rectangle, roundedRectangle, sphere, torus } = jscad.primitives
const { subtract, union, intersect} = jscad.booleans
const { colorize, hexToRgb, hslToRgb, colorNameToRgb } = jscad.colors
const { extrudeLinear} = jscad.extrusions
const { geom2 } = jscad.geometries
const { hullChain } = jscad.hulls
const { mat4 } = jscad.maths
const { vectorText } = jscad.text
const { translate, scale, rotateX, rotateY, rotateZ, center } = jscad.transforms

const options = { segments: 32 }

const getParameterDefinitions = () => [
  //개발자 기능
  { name: 'DEV Mode', type: 'group', caption: '개발자 기능'},
  { name: 'glassEn', type: 'checkbox', caption: '투명모드', checked: true},
  { name: 'alpha', type: 'number', initial: 0.9, min: 0.1, max: 1, step: 0.1, caption: '투명도 : '},
  { name: 'addSceneEn', type: 'checkbox', caption: '제거된피쳐표시', checked: false},
  { name: 'alpha2', type: 'number', initial: 1, min: 0.1, max: 1, step: 0.1, caption: '제거된피쳐 투명도 : '},
  { name: 'color', type: 'color', initial: '#d4d4d4', caption : '컬러변경'},
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
  { name: 'width', type: 'int', initial: 350, caption: '길이(결방향) :' },
  { name: 'dp', type: 'int', initial: 250, caption: '폭 :' },
  { name: 'quantity', type: 'int', caption: '주문수량 :',
    values: [4.5, 15, 18, 24, 30],
    captions: ['4.5mm', '15mm', '18mm', '24mm', '30mm'],
    initial: '15'
  },
  //원점표시
  { name: 'originEn', type: 'checkbox', caption: '원점 표시', checked: true }, 
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
  //액자커팅
  { name: 'angleCut', type: 'group', caption: '액자커팅'},
  { name: 'angleCutEn',type:'checkbox',caption:'액자커팅적용', checked: false },
  { name: 'angleCutOption',type: 'radio', caption: 'Radio Buttons:', values: ['both', 'left', 'right' ],
  captions: ['양쪽', '왼쪽', '오른쪽'], initial: 'both' },
  //씽크대보링
  { name: 'boring', type: 'group', caption: '씽크대보링'},
  { name: 'boringEn',type:'checkbox',caption:'씽크대보링적용', checked: false },
  { name: 'boringDist', type: 'int', initial: 75, caption: '가로 간격 :' },
  //절단면라운딩
  { name: 'fillet', type: 'group', caption: '절단면라운딩'},
  { name: 'filletEn',type:'checkbox',caption:'절단면라운딩적용', checked: false },
  { name: 'filletOption',type: 'radio', caption: 'Radio Buttons:', values: ['both', 'upper', 'lower' ],
  captions: ['모두', '위쪽', '아래쪽'], initial: 'both' },
  //피스타공
  { name: 'counterSink', type: 'group', caption: '피스타공'},
  { name: 'counterSinkEn', type:'checkbox', caption:'피스타공적용', checked: false},
  { name: 'counterSinkAEn', type:'checkbox', caption:'A-A 모서리', checked: true},
  { name: 'counterSinkBEn', type:'checkbox', caption:'B 모서리', checked: false},
  { name: 'counterSinkCEn', type:'checkbox', caption:'C 모서리', checked: false}
]

//베이스판 생성
const createBase = (width, dp, thk) => {
  const base = cuboid({ size: [width, dp, thk] })
  return translate([0, 0, thk / 2], base)
}

//가독성을 위한 라인생성
const createLine = (width, dp, thk) => {
  const baseLineLower = line([[-width/2, -dp/2, thk/2], [width/2, -dp/2], [width/2, dp/2],[-width/2, dp/2],[-width/2, -dp/2]])
  const baseLineUpper = translate([0, 0, thk], baseLineLower)
  const baseLineVerical = [
    translate([-width/2,-dp/2],rotateX(Math.PI/2,line([[0,0],[0,thk]]))),
    translate([ width/2,-dp/2],rotateX(Math.PI/2,line([[0,0],[0,thk]]))),
    translate( [width/2, dp/2],rotateX(Math.PI/2,line([[0,0],[0,thk]]))),
    translate([-width/2, dp/2],rotateX(Math.PI/2,line([[0,0],[0,thk]])))
  ]
  const baseLine = [
    baseLineUpper,
    baseLineLower,
    baseLineVerical
  ]
  return baseLine;
}

//사이즈 텍스트 생성
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

//액자커팅
const createAngleCut = (width, dp, thk, angleCutOption) => {
  const angleCutCuboid = cuboid({size : [dp * 2 , dp * 2, thk ]})
  const angleCutCuboids = [];
  if(angleCutOption === 'left' ){
    angleCutCuboids.push( translate([-width / 2, -dp * Math.sqrt(2) + dp / 2, thk/2], rotateZ(Math.PI / 4, angleCutCuboid)))
  }
  if(angleCutOption === 'right' ){
    angleCutCuboids.push( translate([ width / 2, -dp * Math.sqrt(2) + dp / 2, thk/2], rotateZ(Math.PI / 4, angleCutCuboid)))
  }
  if(angleCutOption === 'both'){
    angleCutCuboids.push( translate([-width / 2, -dp * Math.sqrt(2) + dp / 2, thk/2], rotateZ(Math.PI / 4, angleCutCuboid)))
    angleCutCuboids.push( translate([ width / 2, -dp * Math.sqrt(2) + dp / 2, thk/2], rotateZ(Math.PI / 4, angleCutCuboid)))
  }
  return angleCutCuboids
}

//씽크대보링
const createBoring = (width, dp, thk, boringDist) => {
  const hole = circle({ radius: 35/2, center: [-width/2 + boringDist, 0], segments: options.segments })
  const hole3D = extrudeLinear({ height: 50 }, hole)
  return translate([0, -dp/2 + 23, thk -13], hole3D);
}

//절단면라운딩
const createFillet = (width, dp, thk, filletOption, cornerRoundEn, cornerRoundRadius, cornerRoundAEn, cornerRoundBEn, cornerRoundCEn, cornerRoundDEn) =>{
  const filletRadius = 6
  const edgeCylinderWidth = cylinder({radius : filletRadius, height : width});
  const edgeCuboidWidth = translate([filletRadius / 2, filletRadius / 2, 0],cuboid({size : [filletRadius, filletRadius, width]}))
  const linearFilletWidth = subtract(edgeCuboidWidth, edgeCylinderWidth);
  const edgeCylinderDepth = cylinder({radius : filletRadius, height : dp});
  const edgeCuboidDepth = translate([filletRadius / 2, filletRadius / 2, 0],cuboid({size : [filletRadius, filletRadius, dp]}))
  const linearFilletDepth = subtract(edgeCuboidDepth, edgeCylinderDepth);
  const linearFilletUpper = [
    translate([-width / 2 + filletRadius, 0, thk - filletRadius], rotateZ( Math.PI, rotateX(Math.PI / 2, linearFilletDepth))),
    translate([ width / 2 - filletRadius, 0, thk - filletRadius], rotateX( Math.PI / 2, linearFilletDepth)),
    translate([ 0,  dp / 2 - filletRadius, thk - filletRadius], rotateY(-Math.PI / 2, linearFilletWidth)),
    translate([ 0, -dp / 2 + filletRadius, thk - filletRadius], rotateZ(-Math.PI / 2, rotateX(Math.PI / 2, linearFilletWidth)))
  ];
  const linearFilletLower = translate([0,0, thk],rotateY(Math.PI , linearFilletUpper));

  const roundEdgeTorus = torus({ innerRadius : filletRadius, outerRadius : cornerRoundRadius - filletRadius});
  const roundEdgeCylinder = cylinder({radius : cornerRoundRadius-filletRadius, height : filletRadius * 2});
  const roundEdgeCuboid = translate([cornerRoundRadius/2, cornerRoundRadius/2, filletRadius/2],cuboid({size : [cornerRoundRadius , cornerRoundRadius , filletRadius]}));
  const roundEdgeUnion = union(roundEdgeTorus,roundEdgeCylinder);
  const roundEdgeCut = subtract(roundEdgeCuboid, roundEdgeUnion)

  const roundFilletUpper = [
    translate([ width / 2 - cornerRoundRadius,  dp / 2 - cornerRoundRadius, thk - filletRadius], roundEdgeCut), //C
    translate([ width / 2 - cornerRoundRadius, -dp / 2 + cornerRoundRadius, thk - filletRadius], rotateZ(-Math.PI / 2 , roundEdgeCut)), //D
    translate([-width / 2 + cornerRoundRadius, -dp / 2 + cornerRoundRadius, thk - filletRadius], rotateZ(-Math.PI , roundEdgeCut)), //B
    translate([-width / 2 + cornerRoundRadius,  dp / 2 - cornerRoundRadius, thk - filletRadius], rotateZ( Math.PI / 2 , roundEdgeCut)) //A
  ]

  const roundFilletLower = translate([0,0, thk],rotateY(Math.PI , roundFilletUpper));

  const fillet = [];
  if(filletOption === 'upper'){
    fillet.push(linearFilletUpper);
    if(cornerRoundEn){
      if(cornerRoundAEn){
        fillet.push(translate([-width / 2 + cornerRoundRadius,  dp / 2 - cornerRoundRadius, thk - filletRadius], rotateZ( Math.PI / 2 , roundEdgeCut))); // A
      }
      if(cornerRoundBEn){
        fillet.push(translate([-width / 2 + cornerRoundRadius, -dp / 2 + cornerRoundRadius, thk - filletRadius], rotateZ(-Math.PI , roundEdgeCut))); // B
      }
      if(cornerRoundCEn){
        fillet.push(translate([ width / 2 - cornerRoundRadius,  dp / 2 - cornerRoundRadius, thk - filletRadius], roundEdgeCut)); // C
      }
      if(cornerRoundDEn){
        fillet.push(translate([ width / 2 - cornerRoundRadius, -dp / 2 + cornerRoundRadius, thk - filletRadius], rotateZ(-Math.PI / 2 , roundEdgeCut))); // D
      }
    }
  }
  if(filletOption === 'lower'){
    fillet.push(linearFilletLower);
    if(cornerRoundEn){
      if(cornerRoundAEn){
        fillet.push( roundFilletLower[0] ); // A
      }
      if(cornerRoundBEn){
        fillet.push( roundFilletLower[1] ); // B
      }
      if(cornerRoundCEn){
        fillet.push( roundFilletLower[3] ); // C
      }
      if(cornerRoundDEn){
        fillet.push( roundFilletLower[2] ); // D
      }
    }
  }
  if(filletOption === 'both'){
    fillet.push(linearFilletUpper);
    fillet.push(linearFilletLower);
    if(cornerRoundEn){
      if(cornerRoundAEn){
        fillet.push(translate([-width / 2 + cornerRoundRadius,  dp / 2 - cornerRoundRadius, thk - filletRadius], rotateZ( Math.PI / 2 , roundEdgeCut))); // A
        fillet.push( roundFilletLower[0] ); // A
      }
      if(cornerRoundBEn){
        fillet.push(translate([-width / 2 + cornerRoundRadius, -dp / 2 + cornerRoundRadius, thk - filletRadius], rotateZ(-Math.PI , roundEdgeCut))); // B
        fillet.push( roundFilletLower[1] ); // B
      }
      if(cornerRoundCEn){
        fillet.push(translate([ width / 2 - cornerRoundRadius,  dp / 2 - cornerRoundRadius, thk - filletRadius], roundEdgeCut)); // C
        fillet.push( roundFilletLower[3] ); // C
      }
      if(cornerRoundDEn){
        fillet.push(translate([ width / 2 - cornerRoundRadius, -dp / 2 + cornerRoundRadius, thk - filletRadius], rotateZ(-Math.PI / 2 , roundEdgeCut))); // D
        fillet.push( roundFilletLower[2] ); // D
      }
    }
  }
  return fillet;
}



//피스타공
const createCounterSink = (width, dp, thk) => {
  const head = translate([0, 0, thk-2],cylinder({ radius: 4, height: 4 }));
  const hole = translate([0, 0, (thk-4)/2],cylinder({ radius: 1.5, height: thk - 4 }));
  const csf = union(head, hole);

  const counterSinks = [
    translate([width/2-thk/2, dp/2 - thk/2, 0],csf)
  ];

  return counterSinks;
}





const main = ({
  glassEn, alpha, alpha2, addSceneEn,color, //개발자
  width, dp, thk, //기본치수
  originEn, //원점
  bottomSlotDist, bottomSlotDp, bottomSlotEn, //밑단홈파기
  thkPocketWidth, thkPocketThk, thkPocketEn, //두께홈따기
  thkSlotWidth, thkSlotDp, thkSlotEn, //두께홈파기
  cornerRoundRadius, cornerRoundAEn, cornerRoundBEn, cornerRoundCEn, cornerRoundDEn, cornerRoundEn, //모서리라운딩
  circleCutDisX, circleCutDisY, circleCutDia, circleCutEn, //원형타공
  squareCutDisX, squareCutDisY, rectWidth, rectDp, squareCutEn, //사각타공
  thkAngleCutOption, thkAngleCutEn, //모서리사선커팅
  angleCutOption, angleCutEn, //액자커팅
  boringDist, boringEn, //씽크대보링
  filletOption, filletEn, //절단면라운딩
  counterSinkEn, counterSinkAEn, counterSinkBEn, counterSinkCEn, //피스타공
  circleCutArray
}) => {
  const base = createBase(width, dp, thk);
  let modifiedBase = base;
  let addFeature = [];

  if (bottomSlotEn) {
    const bottomSlot = createbottomSlot(width, dp, bottomSlotDist, bottomSlotDp, thk);
    modifiedBase = subtract(modifiedBase, bottomSlot);
    addFeature = union(addFeature,intersect(base,bottomSlot));
  }
  if (thkPocketEn){
    const thkPocket = createThkPocket(width, dp, thk, thkPocketWidth, thkPocketThk);
    modifiedBase = subtract(modifiedBase, thkPocket);
    addFeature = union(addFeature,intersect(base,thkPocket));
  }
  if (thkSlotEn){
    const thkSlot = createThkSlot(width, dp, thk, thkSlotWidth, thkSlotDp);
    modifiedBase = subtract(modifiedBase, thkSlot);
    addFeature = union(addFeature,intersect(base,thkSlot));
  }
  if (cornerRoundEn) {
    const cornerRound = createCornerRound (width, dp, thk, cornerRoundRadius, cornerRoundAEn, cornerRoundBEn, cornerRoundCEn, cornerRoundDEn);
    modifiedBase = subtract(modifiedBase, cornerRound);
    addFeature = union(addFeature,intersect(base,cornerRound));
  }
  if (circleCutEn) {
    const circleCut = createCircleCut(width, dp, thk, circleCutDisX, circleCutDisY, circleCutDia);
    modifiedBase = subtract(modifiedBase, circleCut);
    addFeature = union(addFeature,intersect(base,circleCut));
  }
  // 원형타공 multi 옵션
  if (circleCutEn) {
    // parameter 배열이면서 요소가 1개 이상 체크
    if (Array.isArray(circleCutArray) && circleCutArray.length > 0) {
      const holeCutMulti = createCircleCutMulti(width, dp, thk, circleCutArray);
      // holeCutMulti.forEach((holeCut) => {
      //   modifiedBase = subtract(modifiedBase, holeCut);
      // });
    }
  }
  if (squareCutEn) {
    const squareCut = createSquareCut(width, dp, thk, squareCutDisX, squareCutDisY, rectWidth, rectDp);
    modifiedBase = subtract(modifiedBase, squareCut);
    // addFeature = union(base,squareCut);
    addFeature = union(addFeature,intersect(base,squareCut));
  }
  if (thkAngleCutEn){
    const thkCut = createThkAngleCut(width, dp, thk, thkAngleCutOption);
    modifiedBase = subtract(modifiedBase, thkCut);
    // addFeature = union(base,thkCut);
    addFeature = union(addFeature,intersect(base,thkCut));
  }
  if (angleCutEn){
    const angleCut = createAngleCut(width, dp, thk, angleCutOption);
    modifiedBase = subtract(modifiedBase, angleCut);
    // addFeature = union(base,angleCut);
    addFeature = union(addFeature,intersect(base,angleCut));
  }
  if (boringEn) {
    const boringCut = createBoring(width, dp, thk, boringDist);
    modifiedBase = subtract(modifiedBase, boringCut);
    // addFeature = union(base,boringCut);
    addFeature = union(addFeature,intersect(base,boringCut));
  }
  if (filletEn) {
    const fillet = createFillet(width, dp, thk, filletOption, cornerRoundEn, cornerRoundRadius, cornerRoundAEn, cornerRoundBEn, cornerRoundCEn, cornerRoundDEn);
    modifiedBase = subtract(modifiedBase, fillet);
    // addFeature = union(base,fillet);
    addFeature = union(addFeature,intersect(base,fillet));
  }

  if (counterSinkEn) {
    const counterSink = createCounterSink(width, dp, thk);
    modifiedBase = subtract(modifiedBase, counterSink);
    // addFeature = union(base,counterSink);
    addFeature = union(addFeature,intersect(base,counterSink));
  }



  const sizeText3D = createSizeText(width, dp, thk);
  const positionedText = translate([0, 0, thk], sizeText3D);
  const originM = createOrigin(width, dp, thk);
  const line = createLine(width, dp, thk);

  const woodScene = [];
  const addScene =[];

  var rgba = hexToRgb(color);
  rgba.push(alpha);


  if(glassEn){
    woodScene.push(colorize(rgba, modifiedBase));
  }
  else{
    woodScene.push(colorize(hexToRgb(color), modifiedBase));
  }
  if (originEn) {
    woodScene.push(originM)
  }

  woodScene.push(colorize([0, 0, 0], positionedText));
  woodScene.push(colorize([0, 0, 0], line));

  if(addSceneEn){
    addScene.push(colorize([1,0,0,alpha2],addFeature));
  }
  else{
    const addScene = [];
  }


  return [woodScene, addScene];
}

module.exports = { main, getParameterDefinitions }