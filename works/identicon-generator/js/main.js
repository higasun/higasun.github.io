'use strict';

{
  class IdenticonRenderer {
    constructor(size, width, height, divs) {
      this.size = size;
      this.width = width;
      this.height = height;
      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
      this.context = this.canvas.getContext('2d');
      this.divs = divs;
  
      this.manipulater = new ArrayManipulator(this.size, this.height, this.width);
    }
  
    render(identicons) {
      identicons.forEach((identicon, idx) => {
        let image;
        // console.log(identicon)
        // console.log(typeof identicon)
        image = this.manipulater.manipulate(identicon);
        image = new ImageData(new Uint8ClampedArray(image), this.width, this.height);
        this.context.putImageData(image, 0, 0);
  
        // canvasからBlobを作成する
        this.canvas.toBlob((blob) => {
          // BlobのURLを作成してimgタグのsrc属性に設定する
          const img = document.createElement('img');
          img.src = URL.createObjectURL(blob);
          if (this.divs[idx].childElementCount !== 0) {
            const curChild = this.divs[idx].children[0];
            this.divs[idx].removeChild(curChild);
          }
          this.divs[idx].appendChild(img);
        }, 'image/png');
      })
    }
  }
  
  class ArrayManipulator {
    constructor(size, height, width) {
      this.size = size;
      this.height = height;
      this.width = width;
      this.ratio = height / size;
    }
  
    manipulate(array) {
      let ar;
      ar = this.mirror(array);
      ar = this.expandArray(ar);
      ar = this.convert(ar);
      return ar;
    }
  
    mirror(ar) {
      // 左右対称になるように配列を操作
      return nj.concatenate(
        nj.array(ar).reshape(this.size, this.size/2),
        nj.array(ar).reshape(this.size, this.size/2).slice(null, [null, null, -1]));
    }
  
    expandArray(ar) {
      // nj.arrayの拡大
      const array = nj.arange(this.height * this.width).reshape(this.height, this.width);
      let org_x, org_y;
  
      for (let x = 0; x < this.height; x++) {
        for (let y = 0; y < this.width; y++) {
          org_x = Math.floor(x / this.ratio);
          org_y = Math.floor(y / this.ratio);
          array.set(x, y, ar.get(org_x, org_y));
        }
      }
      return array
    }
  
    convert(ar) {
      // 表示用の配列からImageData用の配列を生成する
  
      // ImageData用にnj.arrayをjsの配列に変換
      const array = new Array(this.width * this.height * 4); // 4 = RGBA
      for (let x = 0; x < this.height; ++x) {
        for (let y = 0; y < this.width; ++y) {
          const index = (y + (x * this.width)) * 4;
          array[index] = ar.get(x, y) * 255; // Red
          array[index + 1] = ar.get(x, y) * 255; // Green
          array[index + 2] = ar.get(x, y) * 255; // Blue
          array[index + 3] = 255; // Alpha
        }
      }
      return array;
    }
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }
  
  function getRandomChoice(array, size) {
    const res = [];
    const ar = [...array];
    let idx;
    for (let i = 0; i < size; i++) {
      idx = Math.floor(Math.random() * ar.length);
      res.push(ar.splice(idx, 1)[0]);
    };
    return res;
  }
  
  class IdenticonGenerator {
    constructor(n, size, mutN) {
      this.n = n;
      this.size = size;
      this.mutN = mutN;
    }
  
    initIdenticons() {
      const identicons = [];
      for (let i = 0; i < this.n; i++) {
        const identicon = [];
        for (let i = 0; i < this.size*this.size/2; i++) {
          identicon.push(getRandomInt(0, 2));
        }
        identicons.push(identicon);
      }
      return identicons;
    }
  
    generateNext(parents) {
      const generation = [];
      const idxes = [...Array(parents.length)].map((_, i) => i);
      for (let i=0; i < this.n; i++) {
        let [idx1, idx2] = getRandomChoice(idxes, 2);
        const child = this.crossover(parents[idx1], parents[idx2]);
        generation.push(child);
      }
      for (let i = 0; i < this.mutN; i++) {
        generation[i] = this.mutatate(generation[i])
      }
  
      return generation;
    }
  
    crossover(idcn1, idcn2){
      const thres = getRandomInt(0, this.size * this.size / 2);
      const newIdenticon = idcn1.slice(0, thres).concat(idcn2.slice(thres, idcn2.length + 1));
      return newIdenticon;
    }
  
    mutatate(idcn){
      const mutIdx = getRandomInt(0, this.size * this.size / 2);
      const newIdenticon = [...idcn];
      newIdenticon[mutIdx] = (idcn[mutIdx] + 1) % 2;
      return newIdenticon;
    }
  }  

  function selectIdenticon(selectedIdx) {
    selectedIdenticonIdxes.push(selectedIdx);
    identiconDivs[selectedIdx].classList.toggle('selected');
  }

  function resetSelection() {
    selectedIdenticonIdxes = [];
    identiconDivs.forEach(div => {
      div.classList.remove('selected');
    })
  }


  const N = 10;
  const size = 8;
  const width = 128;
  const height = 128;
  const identiconDivs = document.querySelectorAll('.identicon');
  const identiconGenerator = new IdenticonGenerator(N, size, 6);
  const renderer = new IdenticonRenderer(size, width, height, identiconDivs);
  const restart = document.getElementById('restart');
  let selectedIdenticonIdxes = [];
  let identicons = identiconGenerator.initIdenticons();

  identiconDivs.forEach((identicon, idx) => {
    identicon.addEventListener('click', () => {
      selectIdenticon(idx);
    })
  })

  restart.addEventListener('click', () => {
    location.reload();
  })

  renderer.render(identicons);

  document.getElementById('generate').addEventListener('click', () => {
    if (selectedIdenticonIdxes.length < 2) {
      return;
    }
    identicons = selectedIdenticonIdxes.map(idx => identicons[idx]);
    identicons = identiconGenerator.generateNext(identicons);
    renderer.render(identicons);
    resetSelection();
  });
}