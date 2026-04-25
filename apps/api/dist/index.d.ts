# 1. Compile le package types
cd packages/types
npx tsc

# 2. Vérifie que le dist est bien généré
cat dist/index.js

# 3. Compile l'API
cd ../../apps/api
npx tsc

# 4. Vérifie que cors est bien dans le dist
grep -i "cors" dist/index.js | head -5