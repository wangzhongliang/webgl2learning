class Camera{
    constructor(gl, fov, near, far){
        this.projectionMatrix = new Float32Array(16);
        var ratio = gl.canvas.width/gl.canvas.height;
        Matrix4.perspective(this.projectionMatrix, fov || 45, ratio, near || 0.1, far || 100);

        this.transform = new Transform();
        this.viewMatrix = new Float32Array(16);

        this.mode = Camera.MODE_ORBIT;
    }

    panX(v){
        if(this.mode === Camera.MODE_ORBIT) return;
        this.updateViewMatrix();
        this.transform.position.x+=this.transform.right[0] * v;
        this.transform.position.y+=this.transform.right[1] * v;
        this.transform.position.z+=this.transform.right[2] * v;
    }

    panY(v){
        if(this.mode === Camera.MODE_ORBIT) return;
        this.updateViewMatrix();
        this.transform.position.x+=this.transform.up[0] * v;
        this.transform.position.y+=this.transform.up[1] * v;
        this.transform.position.z+=this.transform.up[2] * v;
    }
}