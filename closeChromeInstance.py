import subprocess as subprocess
import sys

def closeChrome(target_process):
    temp_subprocess = subprocess.Popen(['ps', '-aux'], stdout=subprocess.PIPE)
    output, error = temp_subprocess.communicate()

    for line in output.splitlines():
        # if target_process in str(line):
        #     pid = int(line.split(None, 1)[0])
        #     print(pid)
        print(line)

if __name__ == "__main__":
    target_process = sys.argv[1]
    closeChrome(target_process)