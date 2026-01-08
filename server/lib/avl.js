// Minimal AVL tree implementation storing nodes keyed by entry_time
// Each node contains {car_no, slot, entry_time}

class AVLNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.height = 1;
    this.left = null;
    this.right = null;
  }
}

class AVLTree {
  constructor() {
    this.root = null;
  }

  height(node) {
    return node ? node.height : 0;
  }

  updateHeight(node) {
    node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
  }

  balanceFactor(node) {
    return node ? this.height(node.left) - this.height(node.right) : 0;
  }

  rotateRight(y) {
    const x = y.left;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    this.updateHeight(y);
    this.updateHeight(x);
    return x;
  }

  rotateLeft(x) {
    const y = x.right;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    this.updateHeight(x);
    this.updateHeight(y);
    return y;
  }

  insert(key, value) {
    this.root = this._insert(this.root, key, value);
  }

  _insert(node, key, value) {
    if (!node) return new AVLNode(key, value);
    if (key < node.key) node.left = this._insert(node.left, key, value);
    else node.right = this._insert(node.right, key, value);

    this.updateHeight(node);
    const bf = this.balanceFactor(node);
    if (bf > 1 && key < node.left.key) return this.rotateRight(node);
    if (bf < -1 && key > node.right.key) return this.rotateLeft(node);
    if (bf > 1 && key > node.left.key) {
      node.left = this.rotateLeft(node.left);
      return this.rotateRight(node);
    }
    if (bf < -1 && key < node.right.key) {
      node.right = this.rotateRight(node.right);
      return this.rotateLeft(node);
    }
    return node;
  }

  delete(key) {
    this.root = this._delete(this.root, key);
  }

  _minValueNode(node) {
    let current = node;
    while (current.left) current = current.left;
    return current;
  }

  _delete(node, key) {
    if (!node) return node;
    if (key < node.key) node.left = this._delete(node.left, key);
    else if (key > node.key) node.right = this._delete(node.right, key);
    else {
      if (!node.left || !node.right) {
        node = node.left || node.right;
      } else {
        const temp = this._minValueNode(node.right);
        node.key = temp.key;
        node.value = temp.value;
        node.right = this._delete(node.right, temp.key);
      }
    }
    if (!node) return node;
    this.updateHeight(node);
    const bf = this.balanceFactor(node);
    if (bf > 1 && this.balanceFactor(node.left) >= 0) return this.rotateRight(node);
    if (bf > 1 && this.balanceFactor(node.left) < 0) {
      node.left = this.rotateLeft(node.left);
      return this.rotateRight(node);
    }
    if (bf < -1 && this.balanceFactor(node.right) <= 0) return this.rotateLeft(node);
    if (bf < -1 && this.balanceFactor(node.right) > 0) {
      node.right = this.rotateRight(node.right);
      return this.rotateLeft(node);
    }
    return node;
  }

  // inorder traversal returns sorted by key (entry_time)
  inorder() {
    const res = [];
    function dfs(n) {
      if (!n) return;
      dfs(n.left);
      res.push(n.value);
      dfs(n.right);
    }
    dfs(this.root);
    return res;
  }
}

module.exports = AVLTree;
