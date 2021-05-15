import subprocess, os, sys

def closeChrome(target_process):
    temp_subprocess = subprocess.Popen(['ps', '-aux'], stdout=subprocess.PIPE)
    output, error = temp_subprocess.communicate()

    for line in output.splitlines():
        if target_process in str(line):
            pid = (str(line).split(' '))
            pid = [p for p in pid if p is not '']
            pid = pid[1]
            os.kill(int(pid), 9)

if __name__ == "__main__":
    target_process = sys.argv[1]
    closeChrome(target_process)