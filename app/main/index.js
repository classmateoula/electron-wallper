import("electron").then(async ({ default: { app, BrowserWindow, ipcMain, dialog } }) => {
  const isDev = (await import("electron-is-dev")).default;
  const path = (await import("path")).default;

  const mainWin = new BrowserWindow({
    width: 300,
    height: 300,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (isDev) {
    mainWin.loadURL("http://localhost:3000");
  } else {
    mainWin.loadURL(path.resolve(__dirname, "../product/build/index.html"));
  }

  mainWin.on("closed", () => {
    // mainWin = null;
  });

  
  const { WinWin, ffi, CPP, L, NULL } = await import("win-win-api");
  const winFns = new WinWin().winFns();
  const os = await import("os");

  function setParent(childWindow) {
    //壁纸句柄
    let workView = null;
  
    //寻找底层窗体句柄
    let Progman = winFns.FindWindowW(L("Progman"), NULL);
  
    //使用 0x3e8 命令分割出两个 WorkerW
    winFns.SendMessageTimeoutW(Progman, 0x052c, 0, 0, 0, 0x3e8, L("ok"));
  
    //创建回调函数
    const createEnumWindowProc = () =>
      ffi.Callback(CPP.BOOL, [CPP.HWND, CPP.LPARAM], (tophandle) => {
        //寻找桌面句柄
        let defview = winFns.FindWindowExW(
          tophandle,
          0,
          L("SHELLDLL_DefView"),
          NULL
        );
  
        // 如果找到桌面句柄再找壁纸句柄
        if (defview != NULL) {
          workView = winFns.FindWindowExW(0, tophandle, L("WorkerW"), NULL);
        }
  
        return true;
      });
  
    //遍历窗体获得窗口句柄
    winFns.EnumWindows(createEnumWindowProc(), 0);
  
    //获取electron的句柄
    const myAppHwnd = bufferCastInt32(childWindow.getNativeWindowHandle());
  
    //将buffer类型的句柄进行转换
    function bufferCastInt32(buf) {
      return os.endianness() == "LE" ? buf.readInt32LE() : buf.readInt32BE();
    }
  
    //将electron窗口设置在壁纸上层
    winFns.SetParent(myAppHwnd, workView);
  }

  // setParent(mainWin);

  ipcMain.addListener("send-video", () => {
    let videoPath = dialog.showOpenDialogSync({
      title: "选择视频",
      buttonLabel: "确认",
      filters: [{ name: "视频", extensions: ["mp4"] }],
    });
    console.log(videoPath[0]);
  });
});
