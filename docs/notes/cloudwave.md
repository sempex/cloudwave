---
id: sgxlnynp7wmo4nqyldvdjbm
title: Cloudwave
desc: ''
updated: 1683722216616
created: 1683722185654
---

# Concept
The center of our Infrastructure should be a Node JS API running some backend framework. When a specific route is called ("/deploy") the backend should check if a git URL was supplied and the framework type was also present in a separate field. 

It should then start a dagger pipeline for the framework given, that fetches the repo, builds a container for it and stores it in a local registry. If possible it could then also deploy the container to a k0s cluster. But this could also be handled separately with the k0s SDK. 

Later this could be expanted with seceret management and so on.

# Components
## Build Images
It is important to safly build the images in an isolated env
- https://github.com/genuinetools/img

## Store and cache images
Right now im unsure how this is going to work
- https://docs.docker.com/registry/deploying/

