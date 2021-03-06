// Picking.js
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' + // Biến thuộc tính vị trí
  'attribute vec4 a_Color;\n' +    // Biến thuộc tính màu
  'attribute float a_Face;\n' +   // Số bề mặt (Không thể sử dụng int cho biến thuộc tính)
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform mat4 u_MvpMatrix;\n' +
  ///// start thêm 1 //////////
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +   // Coordinate transformation matrix of the normal
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  ///// end thêm 1 //////////
  'uniform int u_PickedFace;\n' + // Số bề mặt của khuôn mặt đã chọn (biến đồng nhất)
  'varying vec4 v_Color;\n' +   // Biến thay đổi
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' + // Phép biến đổi hình chiếu chế độ xem mô hình trên vị trí đỉnh
  ///// start thêm 2 //////////
       // Recalculate the normal based on the model matrix and make its length 1.
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
     // Calculate world coordinate of vertex
  '  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
     // Calculate the light direction and make it 1.0 in length
  '  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
     // Calculate the dot product of the normal and light direction
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
     // Calculate the color due to diffuse reflection
  '  vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
     // Calculate the color due to ambient reflection
  '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
  ///// end thêm 2 //////////
  '  int face = int(a_Face);\n' + 
  ///// start sửa 1 (a_Color.rgb -> diffuse + ambient) //////////
  '  vec3 color = (face == u_PickedFace) ? vec3(1.0, 1.0, 1.0) : diffuse + ambient;\n' +
  ///// end sửa 1 //////////
  '  if(u_PickedFace == 0) {\n' + 
  '    v_Color = vec4(color, a_Face/255.0);\n' + 
  '  } else {\n' +
  '    v_Color = vec4(color, a_Color.a);\n' +
  '  }\n' +
  '}\n';

// Fragment shader program                                            
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' + // Thiết lập màu
  '}\n';

var ANGLE_STEP = 0.0; // Góc xoay (độ / giây)
var g_currentAngle = 0.0; // Góc quay hiện tại
//var g_angleStepUD = 0.0;
///// start thêm 3 //////////
var g_angleStepUD = 0.0;
///// end thêm 3 //////////

function main() {
  // Gọi phần tử canvas
  var canvas = document.getElementById('webgl');

  // Lấy ngữ cảnh dựng hình cho WebGL
  var gl = getWebGLContext(canvas);

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

   // khởi tạo bộ đổ bóng
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Thiết lập toạ độ đỉnh và màu
  var n = initVertexBuffers(gl);

  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Kích hoạt màu nền và kích hoạt khử mặt khuất
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  
  
  var u_PickedFace = gl.getUniformLocation(gl.program, 'u_PickedFace');
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  ///// start thêm 4 //////////
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  ///// end thêm 4 //////////

  if (!u_MvpMatrix || !u_PickedFace) { 
    console.log('Failed to get the storage location of uniform variable');
    return;
  }

  // Thiết lập điểm mắt và khối quan sát
  var viewProjMatrix = new Matrix4();
  ///// start thêm 5 //////////
  var modelMatrix = new Matrix4();  // Model matrix
  var mvpMatrix = new Matrix4();    // Model view projection matrix
  var normalMatrix = new Matrix4(); // Transformation matrix for normals
  ///// end thêm 5 //////////

  viewProjMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 100.0); // Phép chiếu
  viewProjMatrix.lookAt(3.0, 3.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0); // Góc nhìn quan sát

  ///// start thêm 6 //////////
  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 3.0, 3.0, 7.0);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
  
  // Pass the model view projection matrix to the variable u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, viewProjMatrix.elements);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);   // Draw the cube
  ///// end thêm 6 //////////

  // Khởi tạo bề mặt
  gl.uniform1i(u_PickedFace, -1);
  ///// start thêm 9 //////////
  document.onkeydown = function(ev){ keydown(ev, gl, n, g_currentAngle); };
  ///// end thêm 9 //////////

  // Đăng ký trình xử lý sự kiện click chuột
  canvas.onmousedown = function(ev) {   // Chuột được nhấn
    var x = ev.clientX, y = ev.clientY; // Toạ độ trỏ chuột
    var rect = ev.target.getBoundingClientRect();
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
      // Nếu vị trí Đã nhấp nằm bên trong <canvas>, hãy cập nhật bề mặt đã chọn
      ///// start sửa 2 (thêm giá trị truyền vào modelMatrix, u_ModelMatrix, mvpMatrix, u_NormalMatrix, normalMatrix vào hàm) //////////
      updatePickedFace(gl, n, x - rect.left, rect.bottom - y, u_PickedFace, viewProjMatrix, u_MvpMatrix, modelMatrix, u_ModelMatrix, mvpMatrix, u_NormalMatrix, normalMatrix);
      ///// end sửa 2 //////////
    }
  }
  ///// start thêm 10 //////////
  function keydown(ev, gl, n, g_currentAngle) {
  switch (ev.keyCode) {
    case 32: // spacebar
      ANGLE_STEP = 0.0;
      break;
    case 38: // Up arrow key -> the positive rotation of joint1 around the z-axis
      g_angleStepUD -= 15.0;
      break;
    case 40: // Down arrow key -> the negative rotation of joint1 around the z-axis
      g_angleStepUD += 15.0;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      ANGLE_STEP += 20.0;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      ANGLE_STEP -= 20.0;
      break;
    default: return; // Skip drawing at no effective action
  }
}
  ///// end thêm 10 //////////

  var tick = function() {   // Start drawing
    g_currentAngle = animate(g_currentAngle);
    ///// start sửa 3 (thêm giá trị truyền vào modelMatrix, u_ModelMatrix, mvpMatrix, u_NormalMatrix, normalMatrix vào hàm) //////////
    draw(gl, n, g_currentAngle, viewProjMatrix, u_MvpMatrix, modelMatrix, u_ModelMatrix, mvpMatrix, u_NormalMatrix, normalMatrix);
    ///// end sửa 3 //////////
    requestAnimationFrame(tick, canvas);
  };
  tick();
}

function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  var vertices = new Float32Array([   // Toạ độ đỉnh
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
  ]);

  ///// start thêm 7 //////////
  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);
  ///// end thêm 7 //////////

  var colors = new Float32Array([   // Màu
     1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,    // v0-v1-v2-v3 front
     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,    // v0-v3-v4-v5 right
     0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,    // v0-v5-v6-v1 up
     1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 0.0,    // v1-v6-v7-v2 left
     1.0, 0.0, 1.0,   1.0, 0.0, 1.0,   1.0, 0.0, 1.0,   1.0, 0.0, 1.0,    // v7-v4-v3-v2 down
     0.0, 1.0, 1.0,   0.0, 1.0, 1.0,   0.0, 1.0, 1.0,   0.0, 1.0, 1.0     // v4-v7-v6-v5 back
   ]);

  var faces = new Uint8Array([   // Mặt
    1, 1, 1, 1,     // v0-v1-v2-v3 front
    2, 2, 2, 2,     // v0-v3-v4-v5 right
    3, 3, 3, 3,     // v0-v5-v6-v1 up
    4, 4, 4, 4,     // v1-v6-v7-v2 left
    5, 5, 5, 5,     // v7-v4-v3-v2 down
    6, 6, 6, 6,     // v4-v7-v6-v5 back
  ]);

  // Chỉ số của các đỉnh
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Tạo một bộ đệm đối tượng
  var indexBuffer = gl.createBuffer();

  if (!indexBuffer) {
    return -1;
  }

  // Ghi thông tin vào bộ đệm đối tượng 
  if (!initArrayBuffer(gl, vertices, gl.FLOAT, 3, 'a_Position')) return -1; // Coordinate Information
  if (!initArrayBuffer(gl, colors, gl.FLOAT, 3, 'a_Color')) return -1;      // Color Information
  if (!initArrayBuffer(gl, faces, gl.UNSIGNED_BYTE, 1, 'a_Face')) return -1;// Surface Information
  ///// start thêm 8 //////////
  if (!initArrayBuffer(gl, normals, gl.FLOAT, 3, 'a_Normal')) return -1;
  ///// end thêm 8 //////////

  // Bỏ liên kết bộ đệm đối tượng 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Ghi các chỉ số vào đối tượng đệm
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

///// start sửa 4 (thêm giá trị truyền vào modelMatrix, u_ModelMatrix, mvpMatrix, u_NormalMatrix, normalMatrix vào hàm) //////////
function updatePickedFace(gl, n, x, y, u_PickedFace, viewProjMatrix, u_MvpMatrix, modelMatrix, u_ModelMatrix, mvpMatrix, u_NormalMatrix, normalMatrix) {
  ///// end sửa 4 //////////
  var pixels = new Uint8Array(4); // Mảng để lưu trữ giá trị pixel [R,G,B,A]

  // Ghi số bề mặt(A) vào thành phần (nếu được chọn) 
  // Sau khi nhấp chuột, biến u_PickedFace sẽ được thay đổi từ -1 thành 0
  gl.uniform1i(u_PickedFace, 0);  // Vẽ bằng cách viết số bề mặt thành giá trị alpha

  ///// start sửa 5 (thêm giá trị truyền vào modelMatrix, u_ModelMatrix, mvpMatrix, u_NormalMatrix, normalMatrix vào hàm) //////////
  draw(gl, n, g_currentAngle, viewProjMatrix, u_MvpMatrix, modelMatrix, u_ModelMatrix, mvpMatrix, u_NormalMatrix, normalMatrix);
  ///// end sửa 5 //////////

  // Đọc giá trị pixel của vị trí được nhấp. pixel [3] là số bề mặt
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  gl.uniform1i(u_PickedFace, pixels[3]); // Chuyển số bề mặt cho u_PickedFace
}

var g_MvpMatrix = new Matrix4(); // Ma trận chiếu chế độ xem mô hình
  ///// start sửa 6 (thêm giá trị truyền vào modelMatrix, u_ModelMatrix, mvpMatrix, u_NormalMatrix, normalMatrix vào hàm) //////////
function draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix, modelMatrix, u_ModelMatrix, mvpMatrix, u_NormalMatrix, normalMatrix) {
  ///// end sửa 6 //////////

    ///// start sửa 7 //////////
    modelMatrix.setRotate(g_currentAngle, 0.0, 1.0, 0.0); // Rotate around the y-axis
    modelMatrix.rotate(g_angleStepUD, 1.0, 0.0, 0.0);

    // Pass the model matrix to u_ModelMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_MvpMatrix.elements);

    // Pass the model view projection matrix to u_MvpMatrix
    mvpMatrix.set(viewProjMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    ///// end sửa 7 //////////

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

var last = Date.now(); // Lần cuối cùng mà hàm này được gọi là
function animate(angle) {
  var now = Date.now();   // Tính thời gian đã trôi qua
  var elapsed = now - last;
  last = now;
  // Cập nhật góc quay hiện tại (điều chỉnh theo thời gian đã trôi qua)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle % 360;
}

function initArrayBuffer (gl, data, type, num, attribute) {
  var buffer = gl.createBuffer();// Tạo một đối tượng đệm

  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Ghi dữ liệu vào bộ đệm đối tượng
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Gán đối tượng đệm đối tượng cho biến thuộc tính
  var a_attribute = gl.getAttribLocation(gl.program, attribute);

  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }

  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Kích hoạt lệnh gán bộ đệm đối tượng cho biến thuộc tính
  gl.enableVertexAttribArray(a_attribute);

  return true;
}