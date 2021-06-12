import os, sys

def deleteDir(delete_path):
    if os.path.exists(delete_path):
        os.remove(delete_path)
        print('{} deleted successfully!'.format(delete_path))

if __name__ == "__main__":
    target_dir = sys.argv[1]
    deleteDir(target_dir)