import fs from 'fs';

/// 列出目标文件夹下所有音频文件
const listFiles = (dir, musicSuffix) => {
    const files = fs.readdirSync(dir);
    const musicFiles = [];
    for (let i = 0; i < files.length; i++) {
        // 获取当前文件的绝对路径
        const filePath = `${dir}/${files[i]}`;
        // 根据文件路径获取文件信息，返回一个fs.Stats对象
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            // 如果是文件夹
            const subFiles = listFiles(filePath, musicSuffix);
            musicFiles.push(...subFiles);
        } else if (stats.isFile() && musicSuffix.includes(filePath.slice(filePath.lastIndexOf('.')))) {
            musicFiles.push(filePath);
        }
    }
    return musicFiles;
}

export default {
    listFiles
};