$root = "b:\web\Sistema de votaciones IERSB\Administrador de votos\"

Set-Location $root

npm run build
npm run transpile:electron
npm run dev:electron