import k8s from "@kubernetes/client-node";

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sExtensionsApi = kc.makeApiClient(k8s.ApiextensionsV1Api);
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sCustomObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);

export {
  k8sApi as apps,
  k8sExtensionsApi as extensions,
  k8sNetworkingApi as networking,
  k8sCoreApi as core,
  k8sCustomObjectsApi as custom,
};
