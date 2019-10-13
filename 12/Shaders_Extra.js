class GridAxisShader extends Shader{
    constructor(gl,pMatrix){
        var vertSrc = `#version 300 es
in vec3 a_position;	//Standard position data.
layout(location=4) in float a_color;	//Will hold the 4th custom position of the custom position buffer.
uniform mat4 uPMatrix;	
uniform mat4 uMVMatrix;	
uniform mat4 uCameraMatrix;	
uniform vec3 uColor[4];	//Color Array
out lowp vec4 color;	//Color to send to fragment shader.

void main(void){
    color = vec4(uColor[ int(a_color) ],1.0); //Using the 4th float as a color index.
    gl_Position = uPMatrix * uCameraMatrix * uMVMatrix * vec4(a_position, 1.0);
}
        `;

        var fragSrc = `#version 300 es
precision mediump float;
in vec4 color;
out vec4 finalColor;

void main(void){ finalColor = color; }
        `;

        super(gl, vertSrc,fragSrc);

        //标准uniform
        this.setPerspective(pMatrix);

        //自定义uniform
        var uColor = gl.getUniformLocation(this.program,"uColor");
        gl.uniform3fv(uColor, new Float32Array([ 0.8,0.8,0.8,  1,0,0,  0,1,0,  0,0,1 ]));

        //完成清除
        gl.useProgram(null);
    }
}