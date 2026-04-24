import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  DEFAULT_ENTRY_NAME,
  FirebaseError,
  SDK_VERSION,
  _addComponent,
  _addOrOverwriteComponent,
  _apps,
  _clearComponents,
  _components,
  _getProvider,
  _isFirebaseApp,
  _isFirebaseServerApp,
  _isFirebaseServerAppSettings,
  _registerComponent,
  _removeServiceInstance,
  _serverApps,
  deleteApp,
  getApp,
  getApps,
  initializeApp,
  initializeServerApp,
  onLog,
  registerVersion,
  setLogLevel
} from "./chunk-ARB4NKTO.js";
import "./chunk-6DU2HRTW.js";

// node_modules/firebase/app/dist/index.mjs
var name = "firebase";
var version = "12.11.0";
registerVersion(name, version, "app");
export {
  FirebaseError,
  SDK_VERSION,
  DEFAULT_ENTRY_NAME as _DEFAULT_ENTRY_NAME,
  _addComponent,
  _addOrOverwriteComponent,
  _apps,
  _clearComponents,
  _components,
  _getProvider,
  _isFirebaseApp,
  _isFirebaseServerApp,
  _isFirebaseServerAppSettings,
  _registerComponent,
  _removeServiceInstance,
  _serverApps,
  deleteApp,
  getApp,
  getApps,
  initializeApp,
  initializeServerApp,
  onLog,
  registerVersion,
  setLogLevel
};
//# sourceMappingURL=firebase_app.js.map
