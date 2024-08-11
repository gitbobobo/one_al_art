import config from '../config.js'
import fs from 'fs'

const minSize = 100 * 1024 * 1024;

/// 收集整轨文件夹，将其移动到目标文件夹下
const collectCueFolders = (dir, cueFolders) => {
    const files = fs.readdirSync(dir);
    const folders = [];
    var hasCue = false;
    var sizeSatisfy = false;
    var audioCount = 0;
    for (let i = 0; i < files.length; i++) {
        const filePath = `${dir}/${files[i]}`;
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            folders.push(filePath);
        } else if (stats.isFile()) {
            // 如果文件大小大于 100M，且是无损音乐文件，则认为当前目录是整轨文件夹
            const isAudio = config.lossless.includes(filePath.slice(filePath.lastIndexOf('.')));
            if (isAudio) {
                audioCount++;
            }
            if (stats.size > minSize && isAudio) {
                sizeSatisfy = true;
                // wv, flac 文件内部可能包含分轨信息
                const suffix = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()
                if (suffix === '.wv' || suffix === '.flac') {
                    hasCue = true;
                }
            } else if (filePath.slice(filePath.lastIndexOf('.')).toLowerCase() === '.cue') {
                hasCue = true;
            }
        }
    }
    if (hasCue && sizeSatisfy && audioCount < 5) {
        cueFolders.push(dir);
    } else {
        for (let i = 0; i < folders.length; i++) {
            collectCueFolders(folders[i], cueFolders);
        }
    }
}

const main = async () => {
    const cueFolders = [];
    collectCueFolders(config.musicPath, cueFolders);
    console.log('🚀', '整轨文件夹收集完成', cueFolders);

}

main()