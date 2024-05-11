const jscad = require('@jscad/modeling')
const { cuboid, circle, ellipsoid , rectangle } = jscad.primitives
const { subtract, union } = jscad.booleans
const { colorize } = jscad.colors
const { extrudeLinear} = jscad.extrusions
const { geom2 } = jscad.geometries
const { hullChain } = jscad.hulls
const { mat4 } = jscad.maths
const { vectorText } = jscad.text
const { translate, scale, rotateY, rotateZ, center } = jscad.transforms

const options = { segments: 32 }

const getParameterDefinitions = () => [
  //-------------------------------------------------------//
  //목재 선택
  //-------------------------------------------------------//
  { name: 'woodSelection', type: 'group', caption: '목재 선택'},
  { name: 'type', type: 'choice', caption: '목재 종류 :',
    values: [1, 2, 3, 4, 5],
    captions: ['미송집성목', '삼나무집성목', '멀바우집성목', '아카시아집성목', '스프러스집성목'],
    initial: '1'
  },
  { name: 'thickness', type: 'choice', caption: '목재 두께 :',
    values: [4.5, 15, 18, 24, 30],
    captions: ['4.5mm', '15mm', '18mm', '24mm', '30mm'],
    initial: '15'
  },
  { name: 'width', type: 'int', initial: 300, caption: '길이(결방향) :' },
  { name: 'depth', type: 'int', initial: 300, caption: '폭 :' },
  { name: 'quantity', type: 'int', caption: '주문수량 :',
    values: [4.5, 15, 18, 24, 30],
    captions: ['4.5mm', '15mm', '18mm', '24mm', '30mm'],
    initial: '15'
  },
  //-------------------------------------------------------//
  //후가공 선택
  //-------------------------------------------------------//
  //원형타공 (Circle-cut)
  { name: 'circleCut', type: 'group', caption: '원형타공'},
  { name: 'circleCutEnabled', type: 'checkbox', caption: '원형타공적용', checked: false },
  { name: 'circleCutPosX', type: 'int', initial: 0, caption: 'Hole X Position:' },
  { name: 'circleCutPosY', type: 'int', initial: 0, caption: 'Hole Y Position:' },
  { name: 'holeDiameter', type: 'int', initial: 50, caption: 'Hole Diameter:' },
  //사각타공 (Square-Cut)
  { name: 'squareCut', type: 'group', caption: '사각타공'},
  { name: 'squareCutEnabled', type: 'checkbox', caption: '사각타공적용', checked: false },
  { name: 'squareCutPosX', type: 'int', initial: 75, caption: 'Rect X Position:' },
  { name: 'squareCutPosY', type: 'int', initial: 50, caption: 'Rect Y Position:' },
  { name: 'rectWidth', type: 'int', initial: 45, caption: 'Rect Width:' },
  { name: 'rectDepth', type: 'int', initial: 45, caption: 'Rect Depth:' },


  
  //그룹하나 끝
  { name: 'slot', type: 'group', caption: '두께홈파기'},
  { name: 'slotCutEnabled',type:'checkbox',caption:'두께홈파기적용', checked: false },
  //그룹하나 끝
  { name: 'chamfer', type: 'group', caption: '모서리사선커팅'},
  { name: 'chamferEnabled',type:'checkbox',caption:'모서리사선커팅적용', checked: false },
  { name: 'chamferOption',type: 'radio', caption: 'Radio Buttons:', values: ['left', 'right', 'both'], radiocaptions: ['왼쪽', '오른쪽', '양쪽'], initial: 'left' },
  { name: 'chamferSize', type: 'int', initial: 15, caption: 'Chamfer size:' },
  //그룹하나 끝
  { name: 'boring', type: 'group', caption: '싱크대보링'},
  { name: 'boringEnabled',type:'checkbox',caption:'싱크대보링적용', checked: false },
  { name: 'sholeX', type: 'int', initial: 50, caption: 'Hole X Position:' },
  //그룹하나 끝
  { name: 'cornerRound', type: 'group', caption: '모서리라운팅'},
  { name: 'roundedCorners', type: 'checkbox', caption: 'Round the corners', checked: false },
  { name: 'roundRadius', type: 'int', initial: 15, caption: 'Corner radius:' },
  
  //그룹하나 끝
  { name: 'conuterSink', type: 'group', caption: '피스타공'},
  { name: 'cornerHolesEnabled', type:'checkbox', caption:'피스타공적용', checked: false}
]

const createBox = (width, depth, thickness) => {
  const box = cuboid({ size: [width, depth, thickness] })
  // 박스를 Z축 방향으로 두께의 절반만큼 이동시켜, 박스의 바닥면이 Z=0에 위치하도록 함
  return translate([0, 0, thickness / 2], box)
}

// Build text by creating the font strokes (2D), then extruding up (3D).
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

const createSizeText = (width, depth, thickness) => {
  const sizeText = `${width}mm X ${depth}mm X ${thickness}T`
  const sizeTextStr = sizeText.toString()
  if (sizeText.length === 0) {
    return []
  }
  let sizeText3D = text(sizeText.toString(), 2, 1)
  sizeText3D = scale([0.5, 0.5, 0.5], sizeText3D)
  sizeText3D = translate([0, 0, 0], sizeText3D)
  return sizeText3D
}

const createCircleCut = (width, depth, thickness, circleCutPosX, circleCutPosY, holeDiameter) => {
  const hole = circle({ radius: holeDiameter / 2, center: [circleCutPosX, circleCutPosY], segments: options.segments })
  const hole3D = extrudeLinear({ height: thickness*2 }, hole)
  return hole3D
}

const createBoringCut = (width, depth, thickness, sholeX) => {
  const hole = circle({ radius: 35/2, center: [-width/2 + sholeX, 0], segments: options.segments })
  const hole3D = extrudeLinear({ height: 50 }, hole)
  return translate([0, -depth/2 + 23, thickness -13], hole3D);
}

const createRoundedCornerCut = (width, depth, thickness, roundRadius) => {
  const cylinder = circle({radius : roundRadius, center: [-roundRadius, -roundRadius], segment: options.segments})
  const cylinder3D = extrudeLinear({height : thickness}, cylinder)
  const roundBox = rectangle({size : [roundRadius*2, roundRadius*2]});
  const roundBox3D = extrudeLinear({height : thickness}, roundBox)
  const cornerCutBox = subtract(roundBox3D, cylinder3D)

  const cornerCutBoxs = [
    translate([width/2, depth/2], cornerCutBox),
    translate([width/2, -depth/2], rotateZ(-Math.PI / 2, cornerCutBox)),
    translate([-width/2, depth/2], rotateZ(Math.PI / 2,cornerCutBox)),
    translate([-width/2, -depth/2], rotateZ(Math.PI ,cornerCutBox))
  ];
  return cornerCutBoxs;

}

const createChamferCut = (width, depth, thickness, chamferOption, chamferSize) => {
    const chamferBox = rectangle({ size: [50, depth] });
    const chamferBox3D = extrudeLinear({ height: thickness*2 }, chamferBox);
    const chamferBoxs = [
      translate([-width/2, 0], rotateY(-Math.PI / 4, chamferBox3D))
    ]  
    return chamferBoxs;
}

const createSquareCut = (width, depth, thickness, squareCutPosX, squareCutPosY, rectWidth, rectDepth) => {
  // 사각형 생성
  const rect = rectangle({ size: [rectWidth, rectDepth] });
  const rect3D = extrudeLinear({ height: thickness + 10 }, rect);  // 박스를 완전히 관통하기 위해 두께보다 더 높게 설정
  // 사각형 위치 조정
  return translate([squareCutPosX - rectWidth / 2, squareCutPosY - rectDepth / 2, -5], rect3D);
}

const createCornerHoles = (width, depth, thickness) => {
  const holeRadius = 2; // 피스타공 4mm
  const hole = circle({ radius: holeRadius, segments: 64 });
  const hole3D = extrudeLinear({ height: thickness*2 }, hole) // 박스를 완전히 관통하기 위해 두께보다 더 높게 설정}


  // 네 모서리에 구멍을 위치시킵니다.
  const holes = [
    translate([-width/2 + 10, depth/2 -10, 0], hole3D),
    translate([-width/2 + 10, -depth/2 +10, 0], hole3D),
    translate([width/2 - 10, depth/2 -10, 0], hole3D),
    translate([width/2 - 10, -depth/2 +10, 0], hole3D)
  ];

  return holes;
}

const createSquareSideCut = (width, depth, thickness) => {
  // 사각형 생성
  const rect = rectangle({ size: [width, 10] });
  const rect3D = extrudeLinear({ height: thickness/2 }, rect);  // 박스를 완전히 관통하기 위해 두께보다 더 높게 설정
  // 사각형 위치 조정
  return translate([0, -depth/2 + 5, thickness/4], rect3D);
}

const main = ({
  width, depth, thickness,
  circleCutPosX, circleCutPosY, holeDiameter, circleCutEnabled,
  squareCutPosX, squareCutPosY, rectWidth, rectDepth, squareCutEnabled,
  cornerHolesEnabled, slotCutEnabled, boringEnabled, sholeX,
  roundRadius, roundedCorners,
  chamferEnabled, chamferSize, chamferOption
}) => {
  const box = createBox(width, depth, thickness);
  let modifiedBox = box;

  if (circleCutEnabled) {
    const holeCut = createCircleCut(width, depth, thickness, circleCutPosX, circleCutPosY, holeDiameter);
    modifiedBox = subtract(modifiedBox, holeCut);
  }

  if (squareCutEnabled) {
    const squareCut = createSquareCut(width, depth, thickness, squareCutPosX, squareCutPosY, rectWidth, rectDepth);
    modifiedBox = subtract(modifiedBox, squareCut);
    
  }

  if (slotCutEnabled) {
    const squareSideCut = createSquareSideCut(width, depth, thickness);
    modifiedBox = subtract(modifiedBox, squareSideCut);
  }

  if (cornerHolesEnabled) {
    const cornerHoles = createCornerHoles(width, depth, thickness);
    modifiedBox = cornerHoles.reduce((acc, hole) => subtract(acc, hole), modifiedBox);
  }

  if (roundedCorners) {
    const cornerCut = createRoundedCornerCut (width, depth, thickness, roundRadius);
    modifiedBox = subtract(modifiedBox, cornerCut);
  }

  if (boringEnabled) {
    const boringCut = createBoringCut(width, depth, thickness, sholeX);
    modifiedBox = subtract(modifiedBox, boringCut);
  }

  if (chamferEnabled) {
    const chamferCut = createChamferCut(width, depth, thickness, chamferSize, chamferOption);
    modifiedBox = subtract(modifiedBox, chamferCut);
  }


  const sizeText3D = createSizeText(width, depth, thickness);
  const positionedText = translate([0, 0, thickness], sizeText3D);

  return [
    colorize([0.5, 1, 1], modifiedBox),
    colorize([0, 0, 0], positionedText)
  ];
}



module.exports = { main, getParameterDefinitions }
