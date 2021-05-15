import subprocess as subprocess

def closeChrome():
    temp_subprocess = subprocess.Popen(['ps', '-A'], stdout=subprocess.PIPE)
    output, error = temp_subprocess.communicate()

    target_process = "python"
    for line in output.splitlines():
        if target_process in str(line):
            pid = int(line.split(None, 1)[0])
            print(pid)

if __name__ == "__main__":
    closeChrome()